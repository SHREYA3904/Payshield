/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CostMatrixConfig,
  CostEvaluation,
  DecisionAction,
  TransactionInput,
} from '../types/fraud.js';

export interface PolicyEvaluationOutput {
  decision: DecisionAction;
  optimalAction: DecisionAction;
  policyRuleTriggered: string;
  expectedCosts: Record<DecisionAction, CostEvaluation>;
  frictionBudgetCompliant: boolean;
  currentFrictionRate: number;
}

export const DEFAULT_COST_MATRIX: CostMatrixConfig = {
  chargebackFee: 25.0, // Fixed chargeback penalty per fraud incident
  fraudLossMultiplier: 1.0, // 100% of transaction amount lost if allowed
  falsePositiveChurnCost: 45.0, // Customer goodwill loss / churn risk on legitimate block
  falsePositiveAmountMultiplier: 0.05, // Opportunity cost on legitimate cart
  stepUpVerificationCost: 1.5, // SMS OTP / biometrics API challenge fee
  stepUpFrictionDropoffCost: 8.0, // Customer friction / checkout drop-off expectation
  stepUpFraudCaptureRate: 0.88, // 88% of fraudsters abandon or fail step-up challenge
  frictionBudgetPercentage: 2.0, // Max 2.0% of legitimate transactions challenged
  allowThreshold: 0.22, // Below this fraud prob, allow is heavily favored
  blockThreshold: 0.72, // Above this fraud prob, block is favored
};

/**
 * Cost-Aware Policy Engine
 * Evaluates expected monetary loss across ALLOW, STEP-UP, and BLOCK actions,
 * balancing false positives, fraud losses, and customer friction budgets.
 */
export class PolicyEngine {
  private config: CostMatrixConfig;

  constructor(initialConfig: CostMatrixConfig = DEFAULT_COST_MATRIX) {
    this.config = { ...initialConfig };
  }

  public getConfig(): CostMatrixConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CostMatrixConfig>): CostMatrixConfig {
    this.config = { ...this.config, ...newConfig };
    return this.getConfig();
  }

  public evaluate(
    tx: TransactionInput,
    fraudProbability: number,
    currentFrictionRate: number = 1.4 // Default historical sample is ~1.4% (compliant)
  ): PolicyEvaluationOutput {
    const amount = Number(tx.amount) || 0;
    const p = Math.max(0, Math.min(1, fraudProbability));
    const pLegit = 1 - p;

    // 1. Compute Direct Potential Loss If Fraud Occurs
    const fraudExposure = amount * this.config.fraudLossMultiplier + this.config.chargebackFee;

    // 2. Compute Expected Cost for ALLOW:
    // If fraud: we lose fraudExposure. If legitimate: loss = $0.
    const allowDirectFraudLoss = p * fraudExposure;
    const allowTotalCost = allowDirectFraudLoss;

    const allowEvaluation: CostEvaluation = {
      action: 'ALLOW',
      expectedCost: Number(allowTotalCost.toFixed(2)),
      costBreakdown: {
        directFraudLoss: Number(allowDirectFraudLoss.toFixed(2)),
        falsePositiveLoss: 0,
        verificationFrictionCost: 0,
        operationalOverhead: 0,
      },
    };

    // 3. Compute Expected Cost for BLOCK:
    // If fraud: small investigation/recovery overhead ($5).
    // If legitimate: False Positive customer churn & support dispute cost.
    const blockOpOverhead = p * 5.0;
    const falsePositiveLoss = pLegit * (this.config.falsePositiveChurnCost + amount * this.config.falsePositiveAmountMultiplier);
    const blockTotalCost = blockOpOverhead + falsePositiveLoss;

    const blockEvaluation: CostEvaluation = {
      action: 'BLOCK',
      expectedCost: Number(blockTotalCost.toFixed(2)),
      costBreakdown: {
        directFraudLoss: 0,
        falsePositiveLoss: Number(falsePositiveLoss.toFixed(2)),
        verificationFrictionCost: 0,
        operationalOverhead: Number(blockOpOverhead.toFixed(2)),
      },
    };

    // 4. Compute Expected Cost for STEP-UP (Challenging transaction):
    // Verification operational fee (SMS OTP, ID check): stepUpVerificationCost.
    // If fraud: fraudster fails with probability stepUpFraudCaptureRate; remaining (1 - captureRate) escapes.
    // If legitimate: customer friction / dropoff penalty.
    const stepUpAuthFee = this.config.stepUpVerificationCost;
    const stepUpEscapedFraudLoss = p * (1 - this.config.stepUpFraudCaptureRate) * fraudExposure;
    const stepUpFrictionLoss = pLegit * this.config.stepUpFrictionDropoffCost;
    const stepUpTotalCost = stepUpAuthFee + stepUpEscapedFraudLoss + stepUpFrictionLoss;

    const stepUpEvaluation: CostEvaluation = {
      action: 'STEP-UP',
      expectedCost: Number(stepUpTotalCost.toFixed(2)),
      costBreakdown: {
        directFraudLoss: Number(stepUpEscapedFraudLoss.toFixed(2)),
        falsePositiveLoss: 0,
        verificationFrictionCost: Number(stepUpFrictionLoss.toFixed(2)),
        operationalOverhead: Number(stepUpAuthFee.toFixed(2)),
      },
    };

    const expectedCosts: Record<DecisionAction, CostEvaluation> = {
      'ALLOW': allowEvaluation,
      'STEP-UP': stepUpEvaluation,
      'BLOCK': blockEvaluation,
    };

    // 5. Determine Pure Cost-Optimal Action
    let optimalAction: DecisionAction = 'ALLOW';
    let minCost = allowTotalCost;

    if (stepUpTotalCost < minCost) {
      optimalAction = 'STEP-UP';
      minCost = stepUpTotalCost;
    }
    if (blockTotalCost < minCost) {
      optimalAction = 'BLOCK';
      minCost = blockTotalCost;
    }

    // 6. Policy Calibration & Friction Budget Constraint
    const frictionBudgetMet = currentFrictionRate <= this.config.frictionBudgetPercentage;
    let finalDecision: DecisionAction = optimalAction;
    let rule = '';

    if (p >= this.config.blockThreshold) {
      finalDecision = 'BLOCK';
      rule = `Critical Risk Rule: Fraud probability (${(p * 100).toFixed(1)}%) ≥ block threshold (${(this.config.blockThreshold * 100).toFixed(0)}%). Financial exposure ($${fraudExposure.toFixed(2)}) mandates decisive mitigation.`;
    } else if (p < this.config.allowThreshold) {
      finalDecision = 'ALLOW';
      rule = `Standard Clearance Rule: Fraud probability (${(p * 100).toFixed(1)}%) < allow threshold (${(this.config.allowThreshold * 100).toFixed(0)}%). Expected loss ($${allowTotalCost.toFixed(2)}) is lower than verification overhead.`;
    } else {
      // In the intermediate review window [allowThreshold, blockThreshold]
      if (optimalAction === 'STEP-UP') {
        if (frictionBudgetMet) {
          finalDecision = 'STEP-UP';
          rule = `Optimal Cost-Aware Step-Up: Intermediate risk (${(p * 100).toFixed(1)}%). Expected cost of 2FA ($${stepUpTotalCost.toFixed(2)}) beats allowing ($${allowTotalCost.toFixed(2)}) & blocking ($${blockTotalCost.toFixed(2)}). Friction budget (${currentFrictionRate.toFixed(1)}% ≤ ${this.config.frictionBudgetPercentage}%) permits challenge.`;
        } else {
          // Friction budget exceeded: prioritize business friction restraint
          if (p >= 0.50) {
            finalDecision = 'BLOCK';
            rule = `Friction Budget Defense (High): Friction rate (${currentFrictionRate.toFixed(1)}% > ${this.config.frictionBudgetPercentage}%) exhausted. Escalating elevated risk to BLOCK to protect legitimate checkout volume.`;
          } else {
            finalDecision = 'ALLOW';
            rule = `Friction Budget Defense (Low): Friction rate (${currentFrictionRate.toFixed(1)}% > ${this.config.frictionBudgetPercentage}%) exhausted. Downgrading borderline risk to ALLOW to avoid penalizing legitimate user conversion.`;
          }
        }
      } else {
        finalDecision = optimalAction;
        rule = `Cost Minimization Policy: Action ${optimalAction} minimizes total expected system cost ($${minCost.toFixed(2)}) under configured matrix.`;
      }
    }

    return {
      decision: finalDecision,
      optimalAction,
      policyRuleTriggered: rule,
      expectedCosts,
      frictionBudgetCompliant: frictionBudgetMet,
      currentFrictionRate,
    };
  }
}

export const policyEngine = new PolicyEngine();
