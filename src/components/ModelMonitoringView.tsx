/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModelMetricSnapshot, DatasetBenchmark } from '../types/fraud.js';
import { ConfusionMatrixView, RocCurveSvg, ModelComparisonRocOverlay } from './Charts.js';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  UploadCloud,
  Zap,
  Cpu,
  Trophy,
  Layers,
  Database,
  BarChart3,
} from 'lucide-react';

export function ModelMonitoringView() {
  const [models, setModels] = useState<ModelMetricSnapshot[]>([]);
  const [benchmarks, setBenchmarks] = useState<DatasetBenchmark[]>([]);
  const [selectedBenchmarkIndex, setSelectedBenchmarkIndex] = useState(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [deployingVersion, setDeployingVersion] = useState<string | null>(null);
  const [approverName, setApproverName] = useState('Lead ML Risk Architect');
  const [showDeployModal, setShowDeployModal] = useState<ModelMetricSnapshot | null>(null);

  const fetchModels = async () => {
    try {
      const [modelsRes, benchRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/models/benchmarks'),
      ]);

      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data.models || []);
        setAuditLogs(data.auditLogs || []);
      }

      if (benchRes.ok) {
        const bData = await benchRes.json();
        setBenchmarks(bData.benchmarks || []);
      }
    } catch (err) {
      console.error('Failed to load models or benchmarks:', err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDeploy = async (version: string) => {
    setDeployingVersion(version);
    try {
      const res = await fetch('/api/models/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          author: approverName,
        }),
      });
      if (res.ok) {
        setShowDeployModal(null);
        await fetchModels();
      }
    } catch (err) {
      console.error('Failed to deploy model:', err);
    } finally {
      setDeployingVersion(null);
    }
  };

  const prodModel = models.find((m) => m.status === 'production') || models[0];
  const activeBenchmark = benchmarks[selectedBenchmarkIndex];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Model Performance, Benchmarks & Drift Telemetry
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>Continuous Supervised Evaluation</span>
            <span>·</span>
            <span>LightGBM vs XGBoost vs Agent Routing</span>
            <span>·</span>
            <span>Population Stability Index (PSI)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Production Serving:</span>
          <span className="font-bold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-3 py-1 rounded-lg shadow-sm">
            {prodModel?.modelVersion || 'Loading...'}
          </span>
        </div>
      </div>

      {/* TOP SECTION: LightGBM vs XGBoost Dataset Benchmark Comparison */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white font-mono">
                Cross-Dataset Model Benchmarking (LightGBM vs. XGBoost vs. Agent Model)
              </h2>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Empirical evaluation determining which model runs better on which dataset archetype
            </div>
          </div>
          <span className="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2.5 py-1 rounded">
            Agent Routing Invariant
          </span>
        </div>

        {/* Dataset Selection Tabs */}
        {benchmarks.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {benchmarks.map((b, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedBenchmarkIndex(idx)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  selectedBenchmarkIndex === idx
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40 border border-rose-500/50'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{b.datasetName.split('(')[0].trim()}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950/80 text-amber-300 border border-amber-500/30">
                  {b.winner} Wins
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Active Dataset Benchmark Deep-Dive */}
        {activeBenchmark && (
          <div className="space-y-4">
            {/* Dataset Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">Records Tested:</span>
                <span className="font-bold text-white">{activeBenchmark.recordCount.toLocaleString()} transactions</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Fraud Imbalance Rate:</span>
                <span className="font-bold text-rose-400">{activeBenchmark.fraudRate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Feature Topology:</span>
                <span className="font-bold text-slate-300 truncate block">{activeBenchmark.featureTypes}</span>
              </div>
            </div>

            {/* 3-Way Model Scorecard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: LightGBM */}
              <div
                className={`p-5 rounded-xl border relative transition-all ${
                  activeBenchmark.winner === 'LightGBM'
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                {activeBenchmark.winner === 'LightGBM' && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-emerald-400" /> WINNER
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">LightGBM</h3>
                    <span className="text-[10px] font-mono text-slate-400">Leaf-Wise GOSS Bins</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">ROC-AUC:</span>
                    <span className="font-bold text-white text-sm">{activeBenchmark.lightgbmScore.rocAuc.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">F1 Score:</span>
                    <span className="font-bold text-white">{activeBenchmark.lightgbmScore.f1Score.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Inference Latency:</span>
                    <span className="font-bold text-emerald-400">{activeBenchmark.lightgbmScore.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Memory Footprint:</span>
                    <span className="text-slate-300">{activeBenchmark.lightgbmScore.memoryMb} MB</span>
                  </div>
                </div>
              </div>

              {/* Card 2: XGBoost */}
              <div
                className={`p-5 rounded-xl border relative transition-all ${
                  activeBenchmark.winner === 'XGBoost'
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                {activeBenchmark.winner === 'XGBoost' && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" /> WINNER
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">XGBoost</h3>
                    <span className="text-[10px] font-mono text-slate-400">Depth-Wise Exact Trees</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">ROC-AUC:</span>
                    <span className="font-bold text-white text-sm">{activeBenchmark.xgboostScore.rocAuc.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">F1 Score:</span>
                    <span className="font-bold text-white">{activeBenchmark.xgboostScore.f1Score.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Inference Latency:</span>
                    <span className="font-bold text-amber-400">{activeBenchmark.xgboostScore.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Memory Footprint:</span>
                    <span className="text-slate-300">{activeBenchmark.xgboostScore.memoryMb} MB</span>
                  </div>
                </div>
              </div>

              {/* Card 3: PayShield Agent Routing Model */}
              <div
                className={`p-5 rounded-xl border relative transition-all ${
                  activeBenchmark.winner === 'Agent Model'
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                {activeBenchmark.winner === 'Agent Model' && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-rose-400" /> WINNER
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Agent Ensemble</h3>
                    <span className="text-[10px] font-mono text-slate-400">Dynamic Archetype Dispatcher</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">ROC-AUC:</span>
                    <span className="font-bold text-rose-400 text-sm">{activeBenchmark.agentModelScore.rocAuc.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">F1 Score:</span>
                    <span className="font-bold text-rose-400">{activeBenchmark.agentModelScore.f1Score.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Inference Latency:</span>
                    <span className="font-bold text-slate-200">{activeBenchmark.agentModelScore.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Memory Footprint:</span>
                    <span className="text-slate-300">{activeBenchmark.agentModelScore.memoryMb} MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Architectural Rationale Callout */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
              <span className="font-mono text-amber-400 font-bold block mb-1">
                Why {activeBenchmark.winner} Dominates This Dataset:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {activeBenchmark.rationale}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE ROC-AUC MODEL COMPARISON OVERLAY (LightGBM vs XGBoost vs Agent Model) */}
      <ModelComparisonRocOverlay />

      {/* Production Model Supervised Metrics */}
      {prodModel && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-xs font-mono text-slate-400 block mb-1">
                Precision (PPV)
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {(prodModel.precision * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Ratio of true fraud caught over total fraud flags
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-xs font-mono text-slate-400 block mb-1">
                Recall (Capture Rate)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {(prodModel.recall * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Identified fraud incidents vs total ground-truth fraud
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-xs font-mono text-slate-400 block mb-1">
                F1-Score
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {prodModel.f1Score.toFixed(3)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Harmonic mean under severe class imbalance
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
              <span className="text-xs font-mono text-slate-400 block mb-1">
                Discrimination (ROC-AUC)
              </span>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {prodModel.rocAuc.toFixed(3)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Area under Receiver Operating Characteristic curve
              </div>
            </div>
          </div>

          {/* Deep Visualizations: Confusion Matrix & ROC Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Confusion Matrix (6 cols) */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Confusion Matrix ({prodModel.modelVersion})
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Holdout validation evaluation
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400">Ground-Truth Validated</span>
              </div>

              <div className="py-2">
                <ConfusionMatrixView
                  tp={prodModel.confusionMatrix.truePositives}
                  fp={prodModel.confusionMatrix.falsePositives}
                  tn={prodModel.confusionMatrix.trueNegatives}
                  fn={prodModel.confusionMatrix.falseNegatives}
                />
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono">
                <span className="text-rose-400 font-bold">Analytic Takeaway: </span>
                Only {prodModel.confusionMatrix.falseNegatives} fraud cases slipped unnoticed; false alarms contained to {prodModel.confusionMatrix.falsePositives} across {prodModel.confusionMatrix.trueNegatives + prodModel.confusionMatrix.falsePositives} orders.
              </div>
            </div>

            {/* ROC Curve & Latency (6 cols) */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">ROC Discrimination Curve</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    TPR vs FPR Trade-off Curve
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-800/40">
                  AUC = {prodModel.rocAuc}
                </span>
              </div>

              <div className="py-2 flex justify-center">
                <RocCurveSvg auc={prodModel.rocAuc} height={180} />
              </div>

              {/* Data Drift Indicator */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-mono">Feature Population Drift (PSI)</span>
                  <span className="font-mono font-bold text-white">
                    PSI: {prodModel.populationStabilityIndex} · {prodModel.driftStatus}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Covariate Stable</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Model Lifecycle & Version Comparison Registry */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white font-mono">Model Version Registry & Governance State</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Production, candidate, and archived models evaluated on benchmark validation datasets
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">{models.length} Registered Models</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Model Version</th>
                <th className="py-3 px-4">Algorithm Architecture</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1 Score</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">Drift PSI</th>
                <th className="py-3 px-4">Avg Latency</th>
                <th className="py-3 px-4 text-right">Deployment Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {models.map((m) => {
                const isProd = m.status === 'production';
                const isCandidate = m.status === 'candidate';

                return (
                  <tr key={m.modelVersion} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {m.modelVersion}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">{m.algorithm}</td>
                    <td className="py-3 px-4">
                      {isProd ? (
                        <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                          Production Serving
                        </span>
                      ) : isCandidate ? (
                        <span className="text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                          Candidate / Staging
                        </span>
                      ) : (
                        <span className="text-slate-500 uppercase text-[10px]">Archived</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-emerald-400">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-bold text-white">{m.f1Score.toFixed(3)}</td>
                    <td className="py-3 px-4 font-bold text-rose-300">{m.rocAuc.toFixed(3)}</td>
                    <td className="py-3 px-4">{m.populationStabilityIndex}</td>
                    <td className="py-3 px-4">{m.avgLatencyMs} ms</td>
                    <td className="py-3 px-4 text-right">
                      {isProd ? (
                        <span className="text-xs font-semibold text-slate-500">Serving Active</span>
                      ) : isCandidate ? (
                        <button
                          onClick={() => setShowDeployModal(m)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-950/30"
                        >
                          Promote to Production
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Archived</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promotion & Authorization Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-white font-mono">Model Deployment Authorization</span>
              <span className="text-xs font-mono text-rose-400">Governance Gate</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              You are authorizing the deployment of model <strong className="font-mono text-white">{showDeployModal.modelVersion}</strong> to replace the current production serving endpoint.
            </p>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
              <div>Precision: {(showDeployModal.precision * 100).toFixed(1)}%</div>
              <div>Recall: {(showDeployModal.recall * 100).toFixed(1)}%</div>
              <div>F1 Score: {showDeployModal.f1Score.toFixed(3)}</div>
              <div>ROC-AUC: {showDeployModal.rocAuc.toFixed(3)}</div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Authorizing Model Governance Officer
              </label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDeployModal(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeploy(showDeployModal.modelVersion)}
                disabled={deployingVersion === showDeployModal.modelVersion}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-500 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-950/40"
              >
                {deployingVersion === showDeployModal.modelVersion ? 'Deploying...' : 'Approve & Serve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
