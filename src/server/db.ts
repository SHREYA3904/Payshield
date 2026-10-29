/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TransactionRecord,
  TransactionInput,
  PolicyVersion,
  ModelMetricSnapshot,
  SystemMetricsOverview,
  SimulationResult,
  CostMatrixConfig,
  InvestigationStatus,
} from '../types/fraud.js';
import { fraudEngine, DATASET_BENCHMARKS } from './fraudEngine.js';
import { policyEngine, DEFAULT_COST_MATRIX } from './policyEngine.js';
import { geminiService } from './geminiService.js';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export class FraudDatabase {
  private transactions: Map<string, TransactionRecord> = new Map();
  private policyVersions: PolicyVersion[] = [];
  private modelVersions: Map<string, ModelMetricSnapshot> = new Map();
  private auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.initModelVersions();
    this.initPolicyVersions();
    this.seedInitialTransactions();
  }

  private initModelVersions() {
    const models: ModelMetricSnapshot[] = [
      {
        modelVersion: 'PayShield-v2.0-AdaptiveEnsemble',
        name: 'PayShield Agentic Ensemble (Dynamic LightGBM + XGBoost Router)',
        algorithm: 'Autonomous Routing: LightGBM for Categorical/Velocity + XGBoost for High-Exposure Amounts',
        trainedOn: '2026-10-25',
        status: 'production',
        precision: 0.954,
        recall: 0.942,
        f1Score: 0.948,
        rocAuc: 0.989,
        confusionMatrix: {
          truePositives: 189,
          falsePositives: 9,
          trueNegatives: 2454,
          falseNegatives: 10,
        },
        avgLatencyMs: 2.3,
        populationStabilityIndex: 0.034,
        driftStatus: 'STABLE',
        approvedBy: 'Lead AI Cybersecurity Architect',
        approvedAt: '2026-10-26T09:00:00Z',
      },
      {
        modelVersion: 'PayShield-LightGBM-v2',
        name: 'LightGBM Leaf-Wise Histogram Model',
        algorithm: 'Gradient-based One-Side Sampling (GOSS) + Exclusive Feature Bundling (EFB)',
        trainedOn: '2026-10-18',
        status: 'staging',
        precision: 0.938,
        recall: 0.924,
        f1Score: 0.931,
        rocAuc: 0.979,
        confusionMatrix: {
          truePositives: 184,
          falsePositives: 12,
          trueNegatives: 2451,
          falseNegatives: 15,
        },
        avgLatencyMs: 1.6,
        populationStabilityIndex: 0.041,
        driftStatus: 'STABLE',
        approvedBy: 'Lead ML Engineer',
        approvedAt: '2026-10-19T14:00:00Z',
      },
      {
        modelVersion: 'PayShield-XGBoost-v2',
        name: 'XGBoost Regularized Tree Model',
        algorithm: 'Exact Greedy Depth-Wise Splitting + Hessian L1/L2 Regularization',
        trainedOn: '2026-10-15',
        status: 'staging',
        precision: 0.946,
        recall: 0.918,
        f1Score: 0.932,
        rocAuc: 0.982,
        confusionMatrix: {
          truePositives: 183,
          falsePositives: 10,
          trueNegatives: 2453,
          falseNegatives: 16,
        },
        avgLatencyMs: 4.2,
        populationStabilityIndex: 0.039,
        driftStatus: 'STABLE',
        approvedBy: 'Lead Fraud Risk Architect',
        approvedAt: '2026-10-16T11:00:00Z',
      },
      {
        modelVersion: 'PayShield-Candidate-DualTower',
        name: 'Dual-Tower DCN-v3 Candidate',
        algorithm: 'Deep & Cross Network with Real-Time Embedding Attention',
        trainedOn: '2026-10-28',
        status: 'candidate',
        precision: 0.962,
        recall: 0.948,
        f1Score: 0.955,
        rocAuc: 0.992,
        confusionMatrix: {
          truePositives: 191,
          falsePositives: 7,
          trueNegatives: 2456,
          falseNegatives: 8,
        },
        avgLatencyMs: 5.8,
        populationStabilityIndex: 0.031,
        driftStatus: 'STABLE',
      },
    ];

    for (const m of models) {
      this.modelVersions.set(m.modelVersion, m);
    }
  }

  private initPolicyVersions() {
    this.policyVersions = [
      {
        id: 'pol_v2_prod',
        version: 'v2.1.0',
        effectiveFrom: '2026-09-20T00:00:00Z',
        author: 'Chief Risk Officer',
        description: 'Standard production matrix with strict 2.0% friction budget and $45 FP churn factor.',
        config: { ...DEFAULT_COST_MATRIX },
        isActive: true,
      },
      {
        id: 'pol_v1_legacy',
        version: 'v1.0.0',
        effectiveFrom: '2026-05-10T00:00:00Z',
        author: 'Payments Ops',
        description: 'Legacy static risk thresholds without friction constraint.',
        config: {
          ...DEFAULT_COST_MATRIX,
          allowThreshold: 0.15,
          blockThreshold: 0.85,
          frictionBudgetPercentage: 5.0,
        },
        isActive: false,
      },
    ];
  }

  private seedInitialTransactions() {
    const categories = ['Electronics', 'Luxury Retail', 'Travel & Airline', 'Digital Services', 'Supermarket', 'Apparel', 'Crypto Exchange'];
    const countries = ['US', 'GB', 'CA', 'DE', 'FR', 'SG', 'AU', 'NG', 'RU', 'BR'];
    const paymentMethods = ['credit_card', 'debit_card', 'wire_transfer', 'p2p', 'crypto'] as const;

    // Helper to generate deterministic synthetic transactions spanning 14 days
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Defined realistic archetypes
    const archetypes: Array<{
      desc: string;
      amount: number;
      method: (typeof paymentMethods)[number];
      category: string;
      custCountry: string;
      merchCountry: string;
      distKm: number;
      device: 'mobile' | 'desktop' | 'tablet' | 'bot_emulated';
      vpn: boolean;
      vel1h: number;
      vel24h: number;
      avgAmt: number;
      fails: number;
      ageDays: number;
      actual: 'fraud' | 'legitimate';
      invStatus: InvestigationStatus;
      tags: string[];
      notes: string[];
    }> = [
      // 1. Bot Carding / Velocity Attack
      {
        desc: 'Carding bot burst',
        amount: 389.5,
        method: 'credit_card',
        category: 'Digital Services',
        custCountry: 'US',
        merchCountry: 'GB',
        distKm: 5600,
        device: 'bot_emulated',
        vpn: true,
        vel1h: 6,
        vel24h: 18,
        avgAmt: 45,
        fails: 3,
        ageDays: 1,
        actual: 'fraud',
        invStatus: 'confirmed_fraud',
        tags: ['BOT_SIGNATURE', 'VELOCITY_BURST', 'EMULATED_ENV'],
        notes: ['Confirmed carding attack from known Tor exit node.'],
      },
      // 2. High Value ATO Wire Fraud
      {
        desc: 'Account Takeover Wire',
        amount: 8500.0,
        method: 'wire_transfer',
        category: 'Crypto Exchange',
        custCountry: 'US',
        merchCountry: 'RU',
        distKm: 7800,
        device: 'desktop',
        vpn: true,
        vel1h: 2,
        vel24h: 3,
        avgAmt: 220,
        fails: 2,
        ageDays: 450,
        actual: 'fraud',
        invStatus: 'confirmed_fraud',
        tags: ['ACCOUNT_TAKEOVER', 'LARGE_WIRE', 'HIGH_RISK_GEO'],
        notes: ['Customer notified bank of unapproved session from unauthorized IP.'],
      },
      // 3. Legitimate High-Volume Business Travel
      {
        desc: 'Executive Airline Booking',
        amount: 1450.0,
        method: 'credit_card',
        category: 'Travel & Airline',
        custCountry: 'US',
        merchCountry: 'GB',
        distKm: 4200,
        device: 'mobile',
        vpn: false,
        vel1h: 1,
        vel24h: 3,
        avgAmt: 980,
        fails: 0,
        ageDays: 780,
        actual: 'legitimate',
        invStatus: 'confirmed_legitimate',
        tags: ['VERIFIED_TRAVEL', 'ESTABLISHED_VIP'],
        notes: ['Customer completed OTP challenge successfully. Genuine transatlantic flight purchase.'],
      },
      // 4. Borderline Step-Up with Successful 2FA
      {
        desc: 'Unusual Electronics Purchase',
        amount: 620.0,
        method: 'credit_card',
        category: 'Electronics',
        custCountry: 'US',
        merchCountry: 'US',
        distKm: 120,
        device: 'desktop',
        vpn: false,
        vel1h: 2,
        vel24h: 4,
        avgAmt: 95,
        fails: 1,
        ageDays: 120,
        actual: 'legitimate',
        invStatus: 'confirmed_legitimate',
        tags: ['STEP_UP_PASSED', 'AMOUNT_SPIKE'],
        notes: ['SMS OTP challenge satisfied in 14 seconds.'],
      },
      // 5. False Positive Block Dispute
      {
        desc: 'Luxury Gift While Roaming',
        amount: 1850.0,
        method: 'credit_card',
        category: 'Luxury Retail',
        custCountry: 'US',
        merchCountry: 'FR',
        distKm: 6100,
        device: 'mobile',
        vpn: true,
        vel1h: 1,
        vel24h: 2,
        avgAmt: 350,
        fails: 0,
        ageDays: 600,
        actual: 'legitimate',
        invStatus: 'confirmed_legitimate',
        tags: ['FALSE_POSITIVE', 'OVERRIDDEN_BY_ANALYST'],
        notes: ['Customer called customer support; cardholder on anniversary trip in Paris.'],
      },
      // 6. Crypto On-Ramp Stolen Card
      {
        desc: 'Instant Crypto Purchase',
        amount: 1200.0,
        method: 'crypto',
        category: 'Crypto Exchange',
        custCountry: 'US',
        merchCountry: 'SG',
        distKm: 12000,
        device: 'desktop',
        vpn: true,
        vel1h: 3,
        vel24h: 5,
        avgAmt: 80,
        fails: 2,
        ageDays: 2,
        actual: 'fraud',
        invStatus: 'confirmed_fraud',
        tags: ['STOLEN_CARD', 'CRYPTO_EXPOSURE'],
        notes: ['Cardholder filed dispute; unrecoverable crypto rail.'],
      },
    ];

    // Seed realistic base of 120 transactions over past 14 days
    for (let i = 0; i < 120; i++) {
      const timeOffset = (14 - (i / 120) * 14) * dayMs;
      const txTimestamp = new Date(now - timeOffset).toISOString();
      const archetype = archetypes[i % archetypes.length];

      // Random variations
      const isLegitBase = i % 10 !== 0; // ~10% fraud rate for rich demonstration
      const amount = isLegitBase
        ? Math.round((20 + Math.random() * 220) * 100) / 100
        : Math.round((archetype.amount * (0.8 + Math.random() * 0.5)) * 100) / 100;

      const custCountry = archetype.custCountry;
      const merchCountry = isLegitBase ? custCountry : archetype.merchCountry;
      const distKm = isLegitBase ? Math.round(Math.random() * 60) : archetype.distKm;
      const vel1h = isLegitBase ? 1 : archetype.vel1h;
      const vel24h = isLegitBase ? Math.floor(Math.random() * 3 + 1) : archetype.vel24h;
      const avgAmt = isLegitBase ? Math.round(amount * (0.7 + Math.random() * 0.6)) : archetype.avgAmt;
      const fails = isLegitBase ? (Math.random() > 0.9 ? 1 : 0) : archetype.fails;
      const ageDays = isLegitBase ? Math.floor(Math.random() * 500 + 40) : archetype.ageDays;
      const vpn = isLegitBase ? Math.random() > 0.92 : archetype.vpn;
      const device = isLegitBase ? (Math.random() > 0.4 ? 'mobile' : 'desktop') : archetype.device;

      const txInput: TransactionInput = {
        id: `TX-${10000 + i}`,
        amount,
        customerId: `CUST-${100 + (i % 45)}`,
        timestamp: txTimestamp,
        paymentMethod: isLegitBase ? (Math.random() > 0.5 ? 'credit_card' : 'debit_card') : archetype.method,
        merchantCategory: isLegitBase ? categories[i % categories.length] : archetype.category,
        merchantCountry: merchCountry,
        customerCountry: custCountry,
        ipDistanceKm: distKm,
        deviceType: device,
        isVpnOrProxy: vpn,
        velocity1h: vel1h,
        velocity24h: vel24h,
        avgPastAmount: avgAmt,
        failedAttempts24h: fails,
        accountAgeDays: ageDays,
      };

      const pred = fraudEngine.predict(txInput);
      const pol = policyEngine.evaluate(txInput, pred.fraudProbability, 1.4);

      let actualOutcome: 'fraud' | 'legitimate' | undefined;
      let invStatus: InvestigationStatus = 'pending';
      const notes: string[] = [];
      const tags: string[] = [];

      if (i < 90) {
        // Historical older transactions have confirmed ground-truth
        if (pred.riskScore >= 60 || archetype.actual === 'fraud') {
          actualOutcome = isLegitBase && pred.riskScore < 50 ? 'legitimate' : 'fraud';
          invStatus = actualOutcome === 'fraud' ? 'confirmed_fraud' : 'confirmed_legitimate';
          tags.push(actualOutcome === 'fraud' ? 'CONFIRMED_FRAUD' : 'CONFIRMED_LEGITIMATE');
          notes.push(`Case reviewed by Risk Operations. Outcome: ${actualOutcome}.`);
        } else {
          actualOutcome = 'legitimate';
          invStatus = 'confirmed_legitimate';
        }
      } else {
        // Recent 30 transactions: some pending in investigation workspace
        if (pol.decision === 'BLOCK' || pol.decision === 'STEP-UP') {
          invStatus = i % 2 === 0 ? 'under_review' : 'pending';
          tags.push('FLAGGED_FOR_TRIAGE');
        } else {
          invStatus = 'confirmed_legitimate';
          actualOutcome = 'legitimate';
        }
      }

      const record: TransactionRecord = {
        ...txInput,
        id: txInput.id!,
        timestamp: txTimestamp,
        actualOutcome,
        investigationStatus: invStatus,
        investigationNotes: notes,
        evidenceTags: tags,
        assignedAnalyst: invStatus === 'under_review' ? 'Sarah Chen (Senior Analyst)' : undefined,
        evaluation: {
          transactionId: txInput.id!,
          timestamp: txTimestamp,
          fraudProbability: pred.fraudProbability,
          riskScore: pred.riskScore,
          riskLevel: pred.riskLevel,
          decision: pol.decision,
          policyRuleTriggered: pol.policyRuleTriggered,
          expectedCosts: pol.expectedCosts,
          optimalAction: pol.optimalAction,
          shapValues: pred.shapValues,
          baseValue: pred.baseValue,
          modelVersion: pred.modelVersion,
          inferenceLatencyMs: pred.inferenceLatencyMs,
          frictionBudgetCompliant: pol.frictionBudgetCompliant,
          currentFrictionRate: pol.currentFrictionRate,
        },
      };

      this.transactions.set(record.id, record);
    }
  }

  public getTransactions(filters?: {
    dateFrom?: string;
    dateTo?: string;
    riskLevel?: string;
    decision?: string;
    investigationStatus?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): { total: number; transactions: TransactionRecord[] } {
    let list = Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filters) {
      if (filters.riskLevel && filters.riskLevel !== 'ALL') {
        list = list.filter((t) => t.evaluation.riskLevel === filters.riskLevel);
      }
      if (filters.decision && filters.decision !== 'ALL') {
        list = list.filter((t) => t.evaluation.decision === filters.decision);
      }
      if (filters.investigationStatus && filters.investigationStatus !== 'ALL') {
        list = list.filter((t) => t.investigationStatus === filters.investigationStatus);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.customerId.toLowerCase().includes(q) ||
            t.merchantCategory.toLowerCase().includes(q) ||
            t.merchantCountry.toLowerCase().includes(q)
        );
      }
      if (filters.dateFrom) {
        const fromTime = new Date(filters.dateFrom).getTime();
        list = list.filter((t) => new Date(t.timestamp).getTime() >= fromTime);
      }
      if (filters.dateTo) {
        const toTime = new Date(filters.dateTo).getTime();
        list = list.filter((t) => new Date(t.timestamp).getTime() <= toTime);
      }
    }

    const total = list.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { total, transactions: paginated };
  }

  public getTransactionById(id: string): TransactionRecord | undefined {
    return this.transactions.get(id);
  }

  public async evaluateAndStore(
    input: TransactionInput,
    generateAiExplanation: boolean = true
  ): Promise<TransactionRecord> {
    const id = input.id || `TX-${10000 + this.transactions.size + 1}`;
    const timestamp = input.timestamp || new Date().toISOString();

    const txInput: TransactionInput = {
      ...input,
      id,
      timestamp,
    };

    // Calculate current friction rate from stored transactions
    const metrics = this.getSystemMetricsOverview();
    const currentFrictionRate = metrics.frictionRate;

    const pred = fraudEngine.predict(txInput);
    const pol = policyEngine.evaluate(txInput, pred.fraudProbability, currentFrictionRate);

    const evaluationWithoutAi = {
      transactionId: id,
      timestamp,
      fraudProbability: pred.fraudProbability,
      riskScore: pred.riskScore,
      riskLevel: pred.riskLevel,
      decision: pol.decision,
      policyRuleTriggered: pol.policyRuleTriggered,
      expectedCosts: pol.expectedCosts,
      optimalAction: pol.optimalAction,
      shapValues: pred.shapValues,
      baseValue: pred.baseValue,
      modelVersion: pred.modelVersion,
      inferenceLatencyMs: pred.inferenceLatencyMs,
      frictionBudgetCompliant: pol.frictionBudgetCompliant,
      currentFrictionRate: pol.currentFrictionRate,
    };

    let aiExplanation: string | undefined;
    if (generateAiExplanation) {
      aiExplanation = await geminiService.generateExplanation(txInput, evaluationWithoutAi);
    }

    const record: TransactionRecord = {
      ...txInput,
      id,
      timestamp,
      investigationStatus: pol.decision === 'ALLOW' ? 'confirmed_legitimate' : 'pending',
      investigationNotes: [],
      evidenceTags: [],
      evaluation: {
        ...evaluationWithoutAi,
        aiExplanation,
      },
    };

    this.transactions.set(id, record);
    return record;
  }

  public updateInvestigation(
    id: string,
    status: InvestigationStatus,
    note?: string,
    evidenceTag?: string,
    analyst: string = 'Current Analyst'
  ): TransactionRecord {
    const record = this.transactions.get(id);
    if (!record) {
      throw new Error(`Transaction ${id} not found`);
    }

    record.investigationStatus = status;
    record.assignedAnalyst = analyst;
    if (status === 'confirmed_fraud') {
      record.actualOutcome = 'fraud';
      record.resolvedAt = new Date().toISOString();
    } else if (status === 'confirmed_legitimate') {
      record.actualOutcome = 'legitimate';
      record.resolvedAt = new Date().toISOString();
    }

    if (note) {
      record.investigationNotes = record.investigationNotes || [];
      record.investigationNotes.push(`[${new Date().toLocaleTimeString()}] ${analyst}: ${note}`);
    }

    if (evidenceTag) {
      record.evidenceTags = record.evidenceTags || [];
      if (!record.evidenceTags.includes(evidenceTag)) {
        record.evidenceTags.push(evidenceTag);
      }
    }

    this.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: analyst,
      action: `Investigation Status Changed to ${status}`,
      details: `Transaction ${id} marked as ${status}. Tag: ${evidenceTag || 'none'}`,
    });

    return record;
  }

  public getSystemMetricsOverview(): SystemMetricsOverview {
    const list = Array.from(this.transactions.values());
    const totalAnalyzed = list.length;

    let confirmedFraud = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let missedFraud = 0;
    let totalLatency = 0;
    let pendingInvestigations = 0;
    let stepUps = 0;
    let allows = 0;
    let blocks = 0;
    let totalFraudExposurePrevented = 0;
    let totalActualLosses = 0;

    for (const t of list) {
      totalLatency += t.evaluation.inferenceLatencyMs;
      if (t.evaluation.decision === 'ALLOW') allows++;
      if (t.evaluation.decision === 'STEP-UP') stepUps++;
      if (t.evaluation.decision === 'BLOCK') blocks++;

      if (t.investigationStatus === 'pending' || t.investigationStatus === 'under_review') {
        pendingInvestigations++;
      }

      if (t.actualOutcome === 'fraud') {
        confirmedFraud++;
        if (t.evaluation.decision === 'BLOCK' || t.evaluation.decision === 'STEP-UP') {
          totalFraudExposurePrevented += t.amount;
        } else {
          totalActualLosses += t.amount;
          missedFraud++;
        }
      } else if (t.actualOutcome === 'legitimate') {
        if (t.evaluation.decision === 'BLOCK') {
          falsePositives++;
        } else {
          trueNegatives++;
        }
      }
    }

    // Legitimate transactions challenged:
    const legitimateChallenged = list.filter(
      (t) => t.actualOutcome === 'legitimate' && t.evaluation.decision === 'STEP-UP'
    ).length;
    const totalLegitimate = list.filter((t) => t.actualOutcome === 'legitimate').length || 1;
    const frictionRate = Number(((legitimateChallenged / totalLegitimate) * 100).toFixed(2));
    const frictionBudgetMet = frictionRate <= policyEngine.getConfig().frictionBudgetPercentage;

    const fraudDetectionRate =
      confirmedFraud > 0
        ? Number((((confirmedFraud - missedFraud) / confirmedFraud) * 100).toFixed(1))
        : 95.0;

    const falsePositiveRate =
      totalLegitimate > 0 ? Number(((falsePositives / totalLegitimate) * 100).toFixed(2)) : 0.8;

    // Estimated Net Savings = Fraud Prevented - FP Churn - Verification Fees
    const estSavings = Math.max(
      0,
      totalFraudExposurePrevented -
        falsePositives * policyEngine.getConfig().falsePositiveChurnCost -
        stepUps * policyEngine.getConfig().stepUpVerificationCost
    );

    // Group transactions by day for time series
    const dayMap = new Map<string, { volume: number; fraud: number; stepUps: number; prevented: number }>();
    for (const t of list) {
      const d = t.timestamp.split('T')[0];
      const curr = dayMap.get(d) || { volume: 0, fraud: 0, stepUps: 0, prevented: 0 };
      curr.volume++;
      if (t.actualOutcome === 'fraud' || t.evaluation.decision === 'BLOCK') {
        curr.fraud++;
        curr.prevented += t.amount;
      }
      if (t.evaluation.decision === 'STEP-UP') {
        curr.stepUps++;
      }
      dayMap.set(d, curr);
    }

    const timeSeriesMetrics = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        volume: data.volume,
        fraudDetected: data.fraud,
        stepUps: data.stepUps,
        lossesPrevented: Math.round(data.prevented),
      }));

    return {
      totalAnalyzed,
      confirmedFraud,
      fraudDetectionRate,
      falsePositiveRate,
      frictionRate,
      frictionBudgetMet,
      estimatedNetSavings: Math.round(estSavings),
      totalFraudExposurePrevented: Math.round(totalFraudExposurePrevented),
      averageLatencyMs: totalAnalyzed > 0 ? Number((totalLatency / totalAnalyzed).toFixed(1)) : 4.5,
      pendingInvestigations,
      decisionDistribution: {
        allow: allows,
        stepUp: stepUps,
        block: blocks,
      },
      timeSeriesMetrics,
    };
  }

  public simulatePolicy(proposedConfig: CostMatrixConfig): SimulationResult {
    const list = Array.from(this.transactions.values());
    const tempEngine = new (policyEngine.constructor as any)(proposedConfig);

    let currentExpectedTotalCost = 0;
    let proposedExpectedTotalCost = 0;
    let legitimateChallenged = 0;
    let totalLegitimate = 0;
    let fraudCaptured = 0;
    let totalFraud = 0;
    let falsePositives = 0;

    const shifts = {
      allowToStepUp: 0,
      allowToBlock: 0,
      stepUpToAllow: 0,
      stepUpToBlock: 0,
      blockToStepUp: 0,
      blockToAllow: 0,
      unchanged: 0,
    };

    for (const t of list) {
      const currentDecision = t.evaluation.decision;
      currentExpectedTotalCost += t.evaluation.expectedCosts[currentDecision].expectedCost;

      const evalOutput = tempEngine.evaluate(t, t.evaluation.fraudProbability, 1.4);
      const newDecision = evalOutput.decision;
      proposedExpectedTotalCost += evalOutput.expectedCosts[newDecision].expectedCost;

      // Track decision shifts
      if (currentDecision === newDecision) {
        shifts.unchanged++;
      } else if (currentDecision === 'ALLOW' && newDecision === 'STEP-UP') shifts.allowToStepUp++;
      else if (currentDecision === 'ALLOW' && newDecision === 'BLOCK') shifts.allowToBlock++;
      else if (currentDecision === 'STEP-UP' && newDecision === 'ALLOW') shifts.stepUpToAllow++;
      else if (currentDecision === 'STEP-UP' && newDecision === 'BLOCK') shifts.stepUpToBlock++;
      else if (currentDecision === 'BLOCK' && newDecision === 'STEP-UP') shifts.blockToStepUp++;
      else if (currentDecision === 'BLOCK' && newDecision === 'ALLOW') shifts.blockToAllow++;

      if (t.actualOutcome === 'legitimate') {
        totalLegitimate++;
        if (newDecision === 'STEP-UP') legitimateChallenged++;
        if (newDecision === 'BLOCK') falsePositives++;
      } else if (t.actualOutcome === 'fraud') {
        totalFraud++;
        if (newDecision === 'BLOCK' || newDecision === 'STEP-UP') fraudCaptured++;
      }
    }

    const newFrictionRate = totalLegitimate > 0 ? (legitimateChallenged / totalLegitimate) * 100 : 0;
    const fraudCaptureRate = totalFraud > 0 ? (fraudCaptured / totalFraud) * 100 : 95.0;
    const fpRate = totalLegitimate > 0 ? (falsePositives / totalLegitimate) * 100 : 0.8;

    return {
      proposedConfig,
      totalTransactionsTested: list.length,
      currentExpectedTotalCost: Math.round(currentExpectedTotalCost),
      proposedExpectedTotalCost: Math.round(proposedExpectedTotalCost),
      costDelta: Math.round(proposedExpectedTotalCost - currentExpectedTotalCost),
      decisionShifts: shifts,
      newFrictionRate: Number(newFrictionRate.toFixed(2)),
      frictionBudgetMet: newFrictionRate <= proposedConfig.frictionBudgetPercentage,
      fraudCaptureRate: Number(fraudCaptureRate.toFixed(1)),
      falsePositiveRate: Number(fpRate.toFixed(2)),
    };
  }

  public savePolicyVersion(version: string, author: string, desc: string, config: CostMatrixConfig): PolicyVersion {
    // Mark previous active as inactive
    for (const p of this.policyVersions) {
      p.isActive = false;
    }

    const newVersion: PolicyVersion = {
      id: `pol_${Date.now()}`,
      version,
      effectiveFrom: new Date().toISOString(),
      author,
      description: desc,
      config,
      isActive: true,
    };

    policyEngine.updateConfig(config);
    this.policyVersions.unshift(newVersion);

    this.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: author,
      action: `Policy Updated to ${version}`,
      details: `Allow thresh: ${config.allowThreshold}, Block thresh: ${config.blockThreshold}, Friction budget: ${config.frictionBudgetPercentage}%`,
    });

    return newVersion;
  }

  public getPolicyVersions(): PolicyVersion[] {
    return this.policyVersions;
  }

  public getModelVersions(): ModelMetricSnapshot[] {
    return Array.from(this.modelVersions.values());
  }

  public deployModel(version: string, author: string): ModelMetricSnapshot {
    const target = this.modelVersions.get(version);
    if (!target) {
      throw new Error(`Model ${version} not found`);
    }

    // Set other models to deprecated/staging
    for (const [v, m] of this.modelVersions.entries()) {
      if (m.status === 'production') {
        m.status = 'deprecated';
      }
    }

    target.status = 'production';
    target.approvedBy = author;
    target.approvedAt = new Date().toISOString();

    this.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: author,
      action: `Deployed Model ${version} to Production`,
      details: `Validated with F1: ${target.f1Score}, ROC-AUC: ${target.rocAuc}, Drift: ${target.driftStatus}`,
    });

    return target;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  public getDatasetBenchmarks() {
    return DATASET_BENCHMARKS;
  }
}

export const db = new FraudDatabase();
