/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CostMatrixConfig,
  PolicyVersion,
  SimulationResult,
} from '../types/fraud.js';
import { CostFrontierCurve } from './Charts.js';
import {
  Sliders,
  DollarSign,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Play,
  Save,
  RotateCcw,
  History,
  ShieldCheck,
} from 'lucide-react';

interface PolicyStudioViewProps {
  onPolicyUpdated?: () => void;
}

export function PolicyStudioView({ onPolicyUpdated }: PolicyStudioViewProps) {
  const [currentConfig, setCurrentConfig] = useState<CostMatrixConfig | null>(null);
  const [proposedConfig, setProposedConfig] = useState<CostMatrixConfig | null>(null);
  const [policyVersions, setPolicyVersions] = useState<PolicyVersion[]>([]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState('v2.2.0');
  const [authorName, setAuthorName] = useState('Lead Risk Policy Administrator');
  const [description, setDescription] = useState('Optimized friction budget to 1.8% and reduced false positive churn factor');
  const [deploying, setDeploying] = useState(false);

  // Fetch current policy
  const loadPolicy = async () => {
    try {
      const res = await fetch('/api/policy');
      if (res.ok) {
        const data = await res.json();
        setCurrentConfig(data.currentConfig);
        setProposedConfig({ ...data.currentConfig });
        setPolicyVersions(data.versions);
      }
    } catch (err) {
      console.error('Failed to load policy config:', err);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleSimulate = async () => {
    if (!proposedConfig) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/policy/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: proposedConfig }),
      });
      if (res.ok) {
        const simData: SimulationResult = await res.json();
        setSimulation(simData);
      }
    } catch (err) {
      console.error('Failed to simulate policy:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleDeployPolicy = async () => {
    if (!proposedConfig) return;
    setDeploying(true);
    try {
      const res = await fetch('/api/policy/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: versionLabel,
          author: authorName,
          description,
          config: proposedConfig,
        }),
      });
      if (res.ok) {
        setShowDeployModal(false);
        await loadPolicy();
        if (onPolicyUpdated) onPolicyUpdated();
      }
    } catch (err) {
      console.error('Failed to deploy policy:', err);
    } finally {
      setDeploying(false);
    }
  };

  if (!proposedConfig || !currentConfig) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-500 text-xs">
        Loading policy parameters and historical versions...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cost-Aware Policy Studio & Replay Simulator
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Deterministic Rule Calibration</span>
            <span aria-hidden="true">·</span>
            <span>Friction Budget Governance</span>
            <span aria-hidden="true">·</span>
            <span>Historical Backtesting Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{simulating ? 'Simulating Replay...' : 'Simulate Policy on History'}</span>
          </button>

          <button
            onClick={() => setShowDeployModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Policy Changes</span>
          </button>
        </div>
      </div>

      {/* Main Policy Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Parameters (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-sm font-bold text-slate-900">Configurable Decision Matrix</span>
            <button
              onClick={() => setProposedConfig({ ...currentConfig })}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Current Active</span>
            </button>
          </div>

          {/* Risk Thresholds Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Risk Threshold Calibration</span>
              <span className="text-[11px] font-mono text-slate-500">
                Allow &le; {(proposedConfig.allowThreshold * 100).toFixed(0)}% · Step-Up Zone · Block &ge; {(proposedConfig.blockThreshold * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Allow Threshold (&tau;<sub>allow</sub>)</span>
                  <span className="font-mono font-bold">{(proposedConfig.allowThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={Math.round(proposedConfig.allowThreshold * 100)}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      allowThreshold: parseInt(e.target.value, 10) / 100,
                    })
                  }
                  className="w-full accent-slate-900"
                />
                <span className="text-[10px] text-slate-500 block">
                  Transactions with fraud prob below this boundary are auto-approved.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Block Threshold (&tau;<sub>block</sub>)</span>
                  <span className="font-mono font-bold">{(proposedConfig.blockThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="1"
                  value={Math.round(proposedConfig.blockThreshold * 100)}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      blockThreshold: parseInt(e.target.value, 10) / 100,
                    })
                  }
                  className="w-full accent-rose-600"
                />
                <span className="text-[10px] text-slate-500 block">
                  Transactions with fraud prob at or above this threshold are rejected.
                </span>
              </div>
            </div>
          </div>

          {/* Friction Budget Slider */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Legitimate Transaction Friction Budget</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {proposedConfig.frictionBudgetPercentage.toFixed(1)}% Max
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={proposedConfig.frictionBudgetPercentage}
              onChange={(e) =>
                setProposedConfig({
                  ...proposedConfig,
                  frictionBudgetPercentage: parseFloat(e.target.value),
                })
              }
              className="w-full accent-emerald-600"
            />
            <span className="text-[11px] text-slate-500 block">
              Targets that no more than {proposedConfig.frictionBudgetPercentage}% of legitimate customers face additional verification. Policy throttles step-up challenges if exhausted.
            </span>
          </div>

          {/* Cost Matrix Weights */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Monetary Loss & Friction Assumptions</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Fixed Chargeback Fee ($)
                </label>
                <input
                  type="number"
                  value={proposedConfig.chargebackFee}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      chargebackFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  False Positive Churn Cost ($)
                </label>
                <input
                  type="number"
                  value={proposedConfig.falsePositiveChurnCost}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      falsePositiveChurnCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Step-Up Authentication Fee ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={proposedConfig.stepUpVerificationCost}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      stepUpVerificationCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Step-Up Customer Drop-off Cost ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={proposedConfig.stepUpFrictionDropoffCost}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      stepUpFrictionDropoffCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Step-Up Fraud Catch Rate (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.0"
                  value={proposedConfig.stepUpFraudCaptureRate}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      stepUpFraudCaptureRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Fraud Loss Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={proposedConfig.fraudLossMultiplier}
                  onChange={(e) =>
                    setProposedConfig({
                      ...proposedConfig,
                      fraudLossMultiplier: parseFloat(e.target.value) || 1.0,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation & Version History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Expected Cost Frontier Curve Visualizer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Expected Cost Frontier Curves (E[Action] vs Fraud Probability)
                </span>
                <span className="text-[11px] text-slate-500">
                  Continuous mathematical loss trajectories under current weights
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">$500 Baseline</span>
            </div>

            <CostFrontierCurve
              amount={500}
              chargebackFee={proposedConfig.chargebackFee}
              falsePositiveChurn={proposedConfig.falsePositiveChurnCost}
              stepUpCost={proposedConfig.stepUpVerificationCost}
              height={160}
            />

            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-normal">
              <strong className="text-slate-800">Crossover Insight:</strong> ALLOW is optimal for low probability; STEP-UP minimizes loss in intermediate zone; BLOCK becomes optimal as probability exceeds the threshold.
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-900">Historical Replay Simulation</span>
              <span className="text-xs font-mono text-slate-500">
                {simulation ? `${simulation.totalTransactionsTested} records tested` : 'Not run yet'}
              </span>
            </div>

            {simulation ? (
              <div className="space-y-4 text-xs">
                {/* Cost Delta Indicator */}
                <div
                  className={`p-4 rounded-xl border ${
                    simulation.costDelta <= 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-600">
                    Projected Total Expected Loss Shift
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight my-1">
                    {simulation.costDelta <= 0 ? '-' : '+'}$
                    {Math.abs(simulation.costDelta).toLocaleString()}
                  </div>
                  <div className="text-xs">
                    {simulation.costDelta <= 0
                      ? 'Proposed policy reduces aggregate expected financial loss on historical transactions.'
                      : 'Proposed policy increases total expected loss. Re-adjust thresholds.'}
                  </div>
                </div>

                {/* Simulated Friction vs Budget */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Projected Friction Rate</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {simulation.newFrictionRate.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    {simulation.frictionBudgetMet ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Budget Met
                      </span>
                    ) : (
                      <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Over Budget
                      </span>
                    )}
                  </div>
                </div>

                {/* Decision Shifts */}
                <div>
                  <span className="font-bold text-slate-900 block mb-1.5">Action Reclassification Shifts</span>
                  <div className="space-y-1 text-[11px] font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>ALLOW &rarr; STEP-UP: {simulation.decisionShifts.allowToStepUp} txs</div>
                    <div>ALLOW &rarr; BLOCK: {simulation.decisionShifts.allowToBlock} txs</div>
                    <div>STEP-UP &rarr; ALLOW: {simulation.decisionShifts.stepUpToAllow} txs</div>
                    <div>STEP-UP &rarr; BLOCK: {simulation.decisionShifts.stepUpToBlock} txs</div>
                    <div>BLOCK &rarr; STEP-UP: {simulation.decisionShifts.blockToStepUp} txs</div>
                    <div>Unchanged: {simulation.decisionShifts.unchanged} txs</div>
                  </div>
                </div>

                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Simulated Fraud Capture: {simulation.fraudCaptureRate}%</span>
                  <span>FPR: {simulation.falsePositiveRate}%</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Click "Simulate Policy on History" above to backtest these cost and threshold parameters against stored transaction data.
              </div>
            )}
          </div>

          {/* Policy Version History */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-900">Policy Versions & Changelog</span>
              <History className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[300px]">
              {policyVersions.map((v) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-lg border text-xs ${
                    v.isActive
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 font-mono">{v.version}</span>
                    {v.isActive ? (
                      <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-semibold">
                        Active In Production
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Archived</span>
                    )}
                  </div>
                  <div className="text-slate-600 mb-1">{v.description}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Author: {v.author} · {new Date(v.effectiveFrom).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Authorization Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-sm font-bold text-slate-900">Confirm Policy Deployment</span>
              <span className="text-xs font-mono text-slate-500">Authorization Gate</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Applying this policy will update the live production decision rules and expected cost calculations for all subsequent transactions.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Version Identifier</label>
                <input
                  type="text"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Authorizing Officer</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Audit Rationale</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeployPolicy}
                disabled={deploying}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                {deploying ? 'Deploying...' : 'Approve & Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
