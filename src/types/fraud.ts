/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DecisionAction = 'ALLOW' | 'STEP-UP' | 'BLOCK';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'wire_transfer' | 'p2p' | 'crypto';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ModelEngine = 'xgboost' | 'lightgbm' | 'agent_ensemble';

export interface DatasetBenchmark {
  datasetName: string;
  recordCount: number;
  fraudRate: string;
  featureTypes: string;
  xgboostScore: {
    rocAuc: number;
    f1Score: number;
    latencyMs: number;
    memoryMb: number;
  };
  lightgbmScore: {
    rocAuc: number;
    f1Score: number;
    latencyMs: number;
    memoryMb: number;
  };
  agentModelScore: {
    rocAuc: number;
    f1Score: number;
    latencyMs: number;
    memoryMb: number;
  };
  winner: 'LightGBM' | 'XGBoost' | 'Agent Model';
  rationale: string;
}

export type InvestigationStatus = 'pending' | 'under_review' | 'confirmed_fraud' | 'confirmed_legitimate' | 'unresolved';

export interface TransactionInput {
  id?: string;
  amount: number;
  customerId: string;
  timestamp?: string;
  paymentMethod: PaymentMethod;
  merchantCategory: string;
  merchantCountry: string;
  customerCountry: string;
  ipDistanceKm: number;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'bot_emulated';
  isVpnOrProxy: boolean;
  velocity1h: number; // number of transactions in last 1 hour
  velocity24h: number; // number of transactions in last 24 hours
  avgPastAmount: number;
  failedAttempts24h: number;
  accountAgeDays: number;
}

export interface ShapValue {
  feature: string;
  value: number | string | boolean;
  contribution: number; // positive increases fraud risk, negative decreases
  description: string;
}

export interface CostEvaluation {
  action: DecisionAction;
  expectedCost: number;
  costBreakdown: {
    directFraudLoss: number;
    falsePositiveLoss: number;
    verificationFrictionCost: number;
    operationalOverhead: number;
  };
}

export interface DecisionResult {
  transactionId: string;
  timestamp: string;
  fraudProbability: number; // 0.0 - 1.0
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  decision: DecisionAction;
  policyRuleTriggered: string;
  expectedCosts: Record<DecisionAction, CostEvaluation>;
  optimalAction: DecisionAction;
  shapValues: ShapValue[];
  baseValue: number;
  aiExplanation?: string;
  modelVersion: string;
  inferenceLatencyMs: number;
  frictionBudgetCompliant: boolean;
  currentFrictionRate: number;
}

export interface TransactionRecord extends TransactionInput {
  id: string;
  timestamp: string;
  evaluation: DecisionResult;
  actualOutcome?: 'fraud' | 'legitimate';
  investigationStatus: InvestigationStatus;
  investigationNotes?: string[];
  evidenceTags?: string[];
  assignedAnalyst?: string;
  resolvedAt?: string;
}

export interface CostMatrixConfig {
  chargebackFee: number; // e.g. $25
  fraudLossMultiplier: number; // e.g. 1.0x amount
  falsePositiveChurnCost: number; // e.g. $40
  falsePositiveAmountMultiplier: number; // e.g. 0.05
  stepUpVerificationCost: number; // e.g. $1.50
  stepUpFrictionDropoffCost: number; // e.g. $8.00
  stepUpFraudCaptureRate: number; // e.g. 0.85 (85% of fraud caught on step-up)
  frictionBudgetPercentage: number; // e.g. 2.0%
  allowThreshold: number; // e.g. 0.25 (below is allow)
  blockThreshold: number; // e.g. 0.75 (above is block, middle is step-up)
}

export interface PolicyVersion {
  id: string;
  version: string;
  effectiveFrom: string;
  author: string;
  description: string;
  config: CostMatrixConfig;
  isActive: boolean;
}

export interface ModelMetricSnapshot {
  modelVersion: string;
  name: string;
  algorithm: string;
  trainedOn: string;
  status: 'production' | 'staging' | 'deprecated' | 'candidate';
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  avgLatencyMs: number;
  populationStabilityIndex: number; // PSI drift indicator (<0.1 stable, 0.1-0.25 moderate, >0.25 drift)
  driftStatus: 'STABLE' | 'MODERATE_DRIFT' | 'SEVERE_DRIFT';
  approvedBy?: string;
  approvedAt?: string;
}

export interface SystemMetricsOverview {
  totalAnalyzed: number;
  confirmedFraud: number;
  fraudDetectionRate: number; // %
  falsePositiveRate: number; // %
  frictionRate: number; // % of legitimate transactions challenged
  frictionBudgetMet: boolean;
  estimatedNetSavings: number; // $ saved compared to naive allow-all
  totalFraudExposurePrevented: number;
  averageLatencyMs: number;
  pendingInvestigations: number;
  decisionDistribution: {
    allow: number;
    stepUp: number;
    block: number;
  };
  timeSeriesMetrics: Array<{
    date: string;
    volume: number;
    fraudDetected: number;
    stepUps: number;
    lossesPrevented: number;
  }>;
}

export interface SimulationResult {
  proposedConfig: CostMatrixConfig;
  totalTransactionsTested: number;
  currentExpectedTotalCost: number;
  proposedExpectedTotalCost: number;
  costDelta: number;
  decisionShifts: {
    allowToStepUp: number;
    allowToBlock: number;
    stepUpToAllow: number;
    stepUpToBlock: number;
    blockToStepUp: number;
    blockToAllow: number;
    unchanged: number;
  };
  newFrictionRate: number;
  frictionBudgetMet: boolean;
  fraudCaptureRate: number;
  falsePositiveRate: number;
}
