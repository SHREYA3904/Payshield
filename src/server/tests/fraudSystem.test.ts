/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fraudEngine } from '../fraudEngine.js';
import { policyEngine, DEFAULT_COST_MATRIX, PolicyEngine } from '../policyEngine.js';
import { db } from '../db.js';
import { geminiService } from '../geminiService.js';
import { TransactionInput } from '../../types/fraud.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  PAYSHIELD TEST SUITE: AUTOMATED PIPELINE & POLICY  ');
  console.log('======================================================\n');

  // 1. Transaction Validation & Feature Extraction
  console.log('Test Suite 1: Transaction Validation & Feature Extraction');
  const normalTx: TransactionInput = {
    amount: 50.0,
    customerId: 'CUST-101',
    paymentMethod: 'credit_card',
    merchantCategory: 'Retail',
    customerCountry: 'US',
    merchantCountry: 'US',
    ipDistanceKm: 10,
    deviceType: 'mobile',
    isVpnOrProxy: false,
    velocity1h: 1,
    velocity24h: 2,
    avgPastAmount: 50,
    failedAttempts24h: 0,
    accountAgeDays: 400,
  };
  const normalPred = fraudEngine.predict(normalTx);
  assert(normalPred.fraudProbability >= 0 && normalPred.fraudProbability <= 1, 'Fraud probability is bounded [0, 1]');
  assert(normalPred.riskScore >= 0 && normalPred.riskScore <= 100, 'Risk score is normalized [0, 100]');
  assert(normalPred.riskLevel === 'LOW', 'Normal domestic transaction is classified as LOW risk');
  assert(normalPred.shapValues.length > 0, 'SHAP attributions generated successfully');

  // 2. High-Risk Attack Score Generation
  console.log('\nTest Suite 2: Fraud Score Generation for Bot Attack');
  const botAttackTx: TransactionInput = {
    amount: 500.0,
    customerId: 'CUST-BOT-99',
    paymentMethod: 'credit_card',
    merchantCategory: 'Digital Goods',
    customerCountry: 'US',
    merchantCountry: 'RU',
    ipDistanceKm: 7000,
    deviceType: 'bot_emulated',
    isVpnOrProxy: true,
    velocity1h: 8,
    velocity24h: 25,
    avgPastAmount: 30,
    failedAttempts24h: 4,
    accountAgeDays: 1,
  };
  const botPred = fraudEngine.predict(botAttackTx);
  assert(botPred.riskScore >= 75, `Bot attack triggers elevated risk score (${botPred.riskScore} >= 75)`);
  assert(botPred.riskLevel === 'CRITICAL' || botPred.riskLevel === 'HIGH', 'Classified as HIGH or CRITICAL risk');
  const topShap = botPred.shapValues[0];
  assert(topShap.contribution > 0, `Primary SHAP driver is positive log-odds (+${topShap.contribution})`);

  // 3. Cost-Aware Policy Evaluation & Decision
  console.log('\nTest Suite 3: Cost-Aware Policy Evaluation (Expected Cost Minimization)');
  const normalPolicy = policyEngine.evaluate(normalTx, normalPred.fraudProbability, 1.2);
  assert(normalPolicy.decision === 'ALLOW', `Normal low risk ($${normalTx.amount}) is ALLOWed`);
  assert(normalPolicy.expectedCosts.ALLOW.expectedCost <= normalPolicy.expectedCosts.BLOCK.expectedCost, 'Expected cost of ALLOW is lower than BLOCK');

  const botPolicy = policyEngine.evaluate(botAttackTx, botPred.fraudProbability, 1.2);
  assert(botPolicy.decision === 'BLOCK', `Extreme risk bot attack ($${botAttackTx.amount}) is BLOCKED`);

  // 4. Boundary Conditions Around Risk Thresholds
  console.log('\nTest Suite 4: Threshold Boundary Conditions');
  const customEngine = new PolicyEngine({
    ...DEFAULT_COST_MATRIX,
    allowThreshold: 0.20,
    blockThreshold: 0.70,
  });
  // Just below allow threshold (0.19)
  const evalNearAllow = customEngine.evaluate(normalTx, 0.19, 1.0);
  assert(evalNearAllow.decision === 'ALLOW', 'p = 0.19 triggers ALLOW (below 0.20)');

  // Intermediate step-up zone (0.45)
  const evalStepUp = customEngine.evaluate(
    { ...normalTx, amount: 400 },
    0.45,
    1.0
  );
  assert(evalStepUp.decision === 'STEP-UP', 'p = 0.45 triggers STEP-UP 2FA verification');

  // At block threshold (0.70)
  const evalBlock = customEngine.evaluate(normalTx, 0.70, 1.0);
  assert(evalBlock.decision === 'BLOCK', 'p = 0.70 triggers BLOCK');

  // 5. Friction Budget Measurement & Constraint Defense
  console.log('\nTest Suite 5: Friction Budget Constraint Enforcement');
  // When friction rate is 1.2% (under 2.0% budget):
  const evalUnderBudget = customEngine.evaluate({ ...normalTx, amount: 400 }, 0.45, 1.2);
  assert(evalUnderBudget.decision === 'STEP-UP', 'Under friction budget (1.2% <= 2.0%): permits STEP-UP challenge');
  assert(evalUnderBudget.frictionBudgetCompliant === true, 'Friction budget compliant flag is true');

  // When friction rate is 3.5% (exceeding 2.0% budget):
  const evalOverBudget = customEngine.evaluate({ ...normalTx, amount: 400 }, 0.45, 3.5);
  assert(evalOverBudget.decision !== 'STEP-UP', 'Over friction budget (3.5% > 2.0%): throttles STEP-UP to protect legitimate checkout');
  assert(evalOverBudget.frictionBudgetCompliant === false, 'Friction budget compliant flag is false');

  // 6. Ingest, Store, and Feedback Collection
  console.log('\nTest Suite 6: Transaction Storage, Feedback & Triage');
  const createdRecord = await db.evaluateAndStore(normalTx, false);
  assert(createdRecord.id.startsWith('TX-'), `Generated unique transaction ID ${createdRecord.id}`);

  // Analyst marks as confirmed legitimate
  const updatedRecord = db.updateInvestigation(
    createdRecord.id,
    'confirmed_legitimate',
    'Verified via phone OTP',
    'CONFIRMED_LEGITIMATE',
    'Senior Analyst'
  );
  assert(updatedRecord.actualOutcome === 'legitimate', 'Actual outcome recorded as legitimate');
  assert(updatedRecord.investigationNotes?.length === 1, 'Analyst note stored in audit log');

  // 7. Policy Versioning & Audit Trail
  console.log('\nTest Suite 7: Policy Versioning & Audit Logs');
  const initialVersions = db.getPolicyVersions().length;
  const newPol = db.savePolicyVersion(
    'v2.3.0-Test',
    'Automated Test Runner',
    'Test suite threshold adjustment',
    { ...DEFAULT_COST_MATRIX, allowThreshold: 0.24 }
  );
  assert(db.getPolicyVersions().length === initialVersions + 1, 'Policy version stored in history');
  assert(newPol.isActive === true, 'New policy version is active');
  assert(policyEngine.getConfig().allowThreshold === 0.24, 'PolicyEngine updated with new allowThreshold');

  // 8. Grounded AI Explanation Fallback
  console.log('\nTest Suite 8: Grounded AI Explanation Generation');
  const combinedEval = {
    ...normalPolicy,
    ...normalPred,
    transactionId: 'TX-TEST-01',
    timestamp: new Date().toISOString(),
  };
  const explanation = await geminiService.generateExplanation(normalTx, combinedEval as any);
  assert(explanation.length > 30, 'Generated grounded decision explanation');
  assert(explanation.includes('ALLOW') || explanation.includes('Decision'), 'Explanation cites the selected action');

  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
