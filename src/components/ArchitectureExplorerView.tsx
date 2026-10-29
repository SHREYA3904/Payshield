/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  Sliders,
  Sparkles,
  RefreshCw,
  FileCheck2,
  Activity,
  Layers,
  Box,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeArchitectureScene } from './ThreeArchitectureScene.js';

interface ComponentNode {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  icon: any;
  color: string;
  category: 'inference' | 'policy' | 'feedback' | 'governance';
  responsibility: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  implementedFile: string;
  health: 'ACTIVE' | 'CALIBRATED' | 'READY';
  mathematicalBasis: string;
}

const ARCHITECTURE_NODES: ComponentNode[] = [
  {
    id: 'tx_input',
    number: 1,
    name: 'Transaction Input & Ingestion',
    subtitle: 'REST Ingestion & Feature Preprocessing',
    icon: Database,
    color: 'cyan',
    category: 'inference',
    responsibility:
      'Accepts transaction payloads via REST API or CSV batching. Validates schemas, checks ranges, normalizes amounts against customer history, and computes geolocation distance vectors.',
    inputs: ['amount', 'paymentMethod', 'customerCountry', 'merchantCountry', 'ipDistanceKm', 'deviceType', 'velocity1h', 'velocity24h', 'avgPastAmount', 'failedAttempts24h', 'accountAgeDays'],
    outputs: ['Engineered numerical feature vector', 'Sanitized metadata contract'],
    dependencies: ['Client applications', 'Merchant checkout gateways'],
    implementedFile: '/src/server/fraudEngine.ts (predict)',
    health: 'ACTIVE',
    mathematicalBasis: 'Feature scaling: z = (x - \\mu) / \\sigma, Amount Ratio = x / max(\\bar{x}, 10)',
  },
  {
    id: 'fraud_model',
    number: 2,
    name: 'Dual-Engine Model Pod (LightGBM & XGBoost)',
    subtitle: 'Leaf-Wise Histogram & Depth-Wise Tree Ensemble',
    icon: Cpu,
    color: 'emerald',
    category: 'inference',
    responsibility:
      'Runs parallel or dynamically routed inference between LightGBM (1.6ms, leaf-wise GOSS for categorical/IP tokens) and XGBoost (4.2ms, exact greedy splits on continuous amounts).',
    inputs: ['Preprocessed feature vector', 'Categorical device tokens', 'PCA continuous distributions'],
    outputs: ['Fraud probability p in [0, 1]', 'Calibrated risk score (0-100)', 'Model confidence & routing telemetry'],
    dependencies: ['Transaction Input & Ingestion'],
    implementedFile: '/src/server/fraudEngine.ts (Dual Engine)',
    health: 'ACTIVE',
    mathematicalBasis: 'P(fraud) = \\sigma(f_{lightgbm}(x)) \\cdot w_1 + \\sigma(f_{xgboost}(x)) \\cdot w_2',
  },
  {
    id: 'shap_attributions',
    number: 3,
    name: 'SHAP Feature Attribution Engine',
    subtitle: 'Additive Shapley Values for Tree Models',
    icon: Layers,
    color: 'violet',
    category: 'inference',
    responsibility:
      'Decomposes model predictions into exact feature contributions that sum to the difference between final log-odds and population baseline prior.',
    inputs: ['Observed transaction features', 'Base population log-odds prior'],
    outputs: ['List of (feature, value, contribution, explanation) tuples sorted by magnitude'],
    dependencies: ['Dual-Engine Model Pod'],
    implementedFile: '/src/server/fraudEngine.ts (ShapValue[])',
    health: 'CALIBRATED',
    mathematicalBasis: '\\sum_{i=1}^M \\phi_i = f(x) - E[f(x)] (Additive efficiency theorem)',
  },
  {
    id: 'cost_policy',
    number: 4,
    name: 'Cost-Aware Policy Layer',
    subtitle: 'Expected Loss & Friction Budget Engine',
    icon: Sliders,
    color: 'rose',
    category: 'policy',
    responsibility:
      'Evaluates expected financial losses across ALLOW, STEP-UP, and BLOCK actions using the configured cost matrix. Enforces the <= 2.0% legitimate customer friction budget.',
    inputs: ['Fraud probability p', 'Transaction amount', 'Configured cost matrix', 'Current legitimate friction rate'],
    outputs: ['Deterministic decision (ALLOW / STEP-UP / BLOCK)', 'Expected costs per action', 'Triggered rule trace'],
    dependencies: ['Dual-Engine Model Pod', 'Cost Matrix Configuration'],
    implementedFile: '/src/server/policyEngine.ts (evaluatePolicy)',
    health: 'ACTIVE',
    mathematicalBasis: 'E[ALLOW] = p \\cdot L; E[STEP-UP] = C_{ver} + (1-p) C_{fric} + p(1-\\beta) L; E[BLOCK] = (1-p) C_{fp} + p \\cdot C_{inv}',
  },
  {
    id: 'ai_explainer',
    number: 5,
    name: 'Agentic AI Explanation Layer',
    subtitle: 'Gemini 3.8 Flash Grounded Decision Narratives',
    icon: Sparkles,
    color: 'pink',
    category: 'policy',
    responsibility:
      'Generates natural language audit summaries for compliance analysts. Strict invariant: The LLM explains deterministic model outputs; it never overrides security rules.',
    inputs: ['Deterministic policy action', 'SHAP top features', 'Expected cost calculus', 'Customer risk profile'],
    outputs: ['Multi-paragraph grounded explanation', 'Regulatory summary', 'Evidence tags'],
    dependencies: ['Cost-Aware Policy Layer', 'SHAP Attributions'],
    implementedFile: '/src/server/geminiService.ts (generateDecisionExplanation)',
    health: 'ACTIVE',
    mathematicalBasis: 'Grounded generation constrained strictly to SHAP attributions and cost calculus.',
  },
  {
    id: 'feedback_store',
    number: 6,
    name: 'Feedback & Continuous Monitoring Store',
    subtitle: 'Human-in-the-Loop Analyst Verification & Ground Truth',
    icon: RefreshCw,
    color: 'amber',
    category: 'feedback',
    responsibility:
      'Captures analyst investigation outcomes (confirmed fraud vs false positive dispute). Logs decisions with tamper-evident audit trails for retraining.',
    inputs: ['Analyst adjudication', 'Chargeback notifications', 'Customer challenge outcomes'],
    outputs: ['Labeled evaluation dataset', 'Ground truth feedback queue', 'Retraining trigger'],
    dependencies: ['Human Fraud Analysts', 'Payment Network Chargebacks'],
    implementedFile: '/src/server/db.ts (updateInvestigationStatus)',
    health: 'ACTIVE',
    mathematicalBasis: 'Confusion Matrix Updates: \\Delta TP, \\Delta FP, \\Delta TN, \\Delta FN',
  },
  {
    id: 'eval_monitoring',
    number: 7,
    name: 'Continuous Model Evaluation & Drift Monitor',
    subtitle: 'Population Stability Index (PSI) & Discrimination',
    icon: Activity,
    color: 'indigo',
    category: 'feedback',
    responsibility:
      'Tracks precision, recall, F1, and ROC-AUC over sliding time windows. Computes Population Stability Index (PSI) across input feature distributions to detect covariate drift.',
    inputs: ['Labeled historical transactions', 'Production score distributions', 'Baseline validation snapshot'],
    outputs: ['Confusion matrix (TP, FP, TN, FN)', 'ROC curve points', 'Drift status (STABLE / DRIFT)'],
    dependencies: ['Feedback & Monitoring Store'],
    implementedFile: '/src/server/db.ts (evaluateModel)',
    health: 'ACTIVE',
    mathematicalBasis: 'PSI = \\sum (Actual% - Expected%) * ln(Actual% / Expected%); PSI < 0.1 is stable.',
  },
  {
    id: 'governance_deployment',
    number: 8,
    name: 'Model Update & Validation Governance',
    subtitle: 'Candidate Benchmarking & Approved Deployment',
    icon: FileCheck2,
    color: 'slate',
    category: 'governance',
    responsibility:
      'Orchestrates model promotion. Compares candidate model against current production baseline. Requires explicit auditor authorization before promoting candidate to active serving.',
    inputs: ['Candidate model snapshot', 'Holdout validation metrics', 'Authorizing officer identity'],
    outputs: ['Promoted production model', 'Audit log record', 'Serving endpoint switch'],
    dependencies: ['Continuous Model Evaluation'],
    implementedFile: '/src/server/db.ts (deployModel)',
    health: 'READY',
    mathematicalBasis: 'Hypothesis testing & F1/ROC-AUC superiority benchmark before authorization gate.',
  },
];

export function ArchitectureExplorerView() {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cost_policy');
  const activeNode = ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) || ARCHITECTURE_NODES[3];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Pay<span className="text-rose-500">Shield</span> Autonomous Pipeline
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>8 Runtime Stages</span>
            <span>·</span>
            <span>Dual LightGBM & XGBoost Ensemble</span>
            <span>·</span>
            <span>Deterministic Policy & Gemini Grounding</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === '3d'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Cyber View</span>
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === '2d'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>2D Topology Schematic</span>
          </button>
        </div>
      </div>

      {/* Primary Display: 3D Scene or 2D Interactive Schematic */}
      {viewMode === '3d' ? (
        <ThreeArchitectureScene />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Interactive Pipeline Topology</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Select any node below to inspect formulas, data contracts, and live code implementations
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded">
              All 8 Nodes Operational
            </span>
          </div>

          {/* Inference & Policy Tier */}
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
              Tier 1: Online Transaction Inference & Cost Policy
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ARCHITECTURE_NODES.slice(0, 5).map((node) => {
                const isSelected = activeNode.id === node.id;
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'border-rose-500 bg-slate-950 text-white shadow-lg shadow-rose-950/30'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Node {node.number}
                      </span>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="font-bold text-xs mb-1 truncate text-white">{node.name}</div>
                    <div className="text-[11px] truncate text-slate-400">
                      {node.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback & Governance Tier */}
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
              Tier 2: Closed-Loop Human Verification, Monitoring & Governance
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ARCHITECTURE_NODES.slice(5).map((node) => {
                const isSelected = activeNode.id === node.id;
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'border-rose-500 bg-slate-950 text-white shadow-lg shadow-rose-950/30'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Node {node.number}
                      </span>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="font-bold text-xs mb-1 truncate text-white">{node.name}</div>
                    <div className="text-[11px] truncate text-slate-400">
                      {node.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected Node Detailed Specification Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-rose-400 shadow-inner">
              <activeNode.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-rose-400 font-bold">Node {activeNode.number}</span>
                <span className="font-bold text-base text-white font-mono">{activeNode.name}</span>
              </div>
              <span className="text-slate-400 text-xs">{activeNode.subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
              Code: {activeNode.implementedFile}
            </span>
            <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-mono text-[10px] font-bold">
              {activeNode.health}
            </span>
          </div>
        </div>

        {/* Responsibility */}
        <div>
          <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            System Responsibility & Invariants
          </span>
          <p className="text-slate-300 leading-relaxed text-sm bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            {activeNode.responsibility}
          </p>
        </div>

        {/* Mathematical Basis */}
        <div>
          <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            Mathematical & Algorithmic Formulation
          </span>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono text-xs text-rose-300 overflow-x-auto">
            {activeNode.mathematicalBasis}
          </div>
        </div>

        {/* I/O Contracts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block">
              Inbound Parameters / Inputs
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeNode.inputs.map((inp, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                >
                  {inp}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block">
              Outbound Signals / Outputs
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeNode.outputs.map((out, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                >
                  {out}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
