/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SystemMetricsOverview,
  TransactionRecord,
} from '../types/fraud.js';
import { TrendBarChart } from './Charts.js';
import {
  ShieldAlert,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Radio,
  Download,
  FileText,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { TabId } from './Navbar.js';
import { AnomalyHeatmap } from './AnomalyHeatmap.js';
import { PredictiveTrendAnalysis } from './PredictiveTrendAnalysis.js';

interface DashboardViewProps {
  metrics: SystemMetricsOverview | null;
  recentTransactions: TransactionRecord[];
  onSelectTransaction: (tx: TransactionRecord) => void;
  onNavigate: (tab: TabId) => void;
  onOpenReportModal?: () => void;
}

export function DashboardView({
  metrics,
  recentTransactions,
  onSelectTransaction,
  onNavigate,
  onOpenReportModal,
}: DashboardViewProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [isSimulating, setIsSimulating] = useState(false);
  const [analyticsSection, setAnalyticsSection] = useState<'both' | 'heatmaps' | 'predictive'>('both');

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-3 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Booting PayShield live defense telemetry...</p>
      </div>
    );
  }

  // Filter time series data
  const chartData = metrics.timeSeriesMetrics.map((m) => ({
    label: m.date.slice(5),
    valueA: m.volume,
    valueB: m.fraudDetected,
  }));

  const totalDecisions =
    metrics.decisionDistribution.allow +
    metrics.decisionDistribution.stepUp +
    metrics.decisionDistribution.block || 1;

  const allowPct = ((metrics.decisionDistribution.allow / totalDecisions) * 100).toFixed(1);
  const stepUpPct = ((metrics.decisionDistribution.stepUp / totalDecisions) * 100).toFixed(1);
  const blockPct = ((metrics.decisionDistribution.block / totalDecisions) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans text-slate-100">
      {/* Top Header Row & Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Pay<span className="text-rose-500">Shield</span> Defense Command Center
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>Adaptive LightGBM & XGBoost Ensemble</span>
            <span>·</span>
            <span>Cost-Aware Loss Optimization</span>
            <span>·</span>
            <span>Friction Budget &le; 2.0%</span>
          </div>
        </div>

        {/* Controls: Download Report, Live Ingestion Stream & Time Filter */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-md border border-slate-700/80 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Download Executive Report</span>
            </button>
          )}

          <button
            disabled={isSimulating}
            onClick={async () => {
              setIsSimulating(true);
              try {
                const sample = {
                  amount: Math.round((Math.random() > 0.4 ? 20 + Math.random() * 80 : 350 + Math.random() * 1200) * 100) / 100,
                  customerId: `CUST-LIVE-${Math.floor(Math.random() * 899 + 100)}`,
                  paymentMethod: Math.random() > 0.3 ? 'credit_card' : 'wire_transfer',
                  merchantCategory: Math.random() > 0.5 ? 'Electronics' : 'Travel & Airline',
                  customerCountry: 'US',
                  merchantCountry: Math.random() > 0.7 ? 'GB' : 'US',
                  ipDistanceKm: Math.random() > 0.7 ? 4800 : 25,
                  deviceType: Math.random() > 0.8 ? 'bot_emulated' : 'mobile',
                  isVpnOrProxy: Math.random() > 0.75,
                  velocity1h: Math.random() > 0.8 ? 5 : 1,
                  velocity24h: Math.random() > 0.8 ? 12 : 2,
                  avgPastAmount: 55,
                  failedAttempts24h: Math.random() > 0.85 ? 2 : 0,
                  accountAgeDays: Math.random() > 0.7 ? 2 : 360,
                };

                const res = await fetch('/api/transactions/evaluate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(sample),
                });
                if (res.ok) {
                  const created = await res.json();
                  onSelectTransaction(created);
                }
              } catch (e) {
                console.error(e);
              } finally {
                setIsSimulating(false);
              }
            }}
            className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-md shadow-rose-950/40 border border-rose-500/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse text-amber-300' : ''}`} />
            <span>{isSimulating ? 'Processing Influx...' : '+ Stream Live Packet'}</span>
          </button>

          {/* Time Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {(['7d', '14d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                  timeRange === r
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (60-30-10 discipline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Estimated Net Savings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Estimated Net Savings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            ${metrics.estimatedNetSavings.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-mono">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Fraud exposure avoided vs naive baseline</span>
          </div>
        </div>

        {/* KPI 2: Fraud Detection Rate */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Fraud Capture Rate</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-rose-400">
            {metrics.fraudDetectionRate.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
            <span>Captured: {metrics.confirmedFraud} threats</span>
            <span>·</span>
            <span>FPR: {metrics.falsePositiveRate}%</span>
          </div>
        </div>

        {/* KPI 3: Friction Budget vs Actual */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Customer Friction Rate</span>
            {metrics.frictionBudgetMet ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {metrics.frictionRate.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">/ budget &le; 2.0%</span>
          </div>
          <div className="text-xs mt-2 font-mono">
            {metrics.frictionBudgetMet ? (
              <span className="text-emerald-400 font-medium">Within &le;2.0% friction budget</span>
            ) : (
              <span className="text-amber-400 font-medium">Exceeds friction budget threshold</span>
            )}
          </div>
        </div>

        {/* KPI 4: Inference Latency & Queue */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Decision Latency</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
            {metrics.averageLatencyMs} ms
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>Volume: {metrics.totalAnalyzed}</span>
            <button
              onClick={() => onNavigate('investigation')}
              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              {metrics.pendingInvestigations} review &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Multi-Dimensional Anomaly Heatmap Section */}
      <AnomalyHeatmap
        transactions={recentTransactions}
        onSelectTransaction={onSelectTransaction}
      />

      {/* NEW: Predictive Trend Analysis Section */}
      <PredictiveTrendAnalysis />

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Volume & Fraud Trend (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Transaction Volume & Fraud Capture Trend</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Real-time throughput against model-flagged & confirmed fraudulent attempts
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {chartData.length} daily observations
            </span>
          </div>
          <TrendBarChart data={chartData} height={200} />
        </div>

        {/* Chart 2: Decision Policy Distribution */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white font-mono">Policy Action Allocation</h2>
              <span className="text-xs text-slate-400 font-mono">{metrics.totalAnalyzed} total</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
              Real-time distribution resulting from cost-aware expected loss minimization.
            </p>

            <div className="space-y-4">
              {/* ALLOW */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">ALLOW (Approved)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {metrics.decisionDistribution.allow} ({allowPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                  <div
                    style={{ width: `${allowPct}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              {/* STEP-UP */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">STEP-UP (2FA Challenge)</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {metrics.decisionDistribution.stepUp} ({stepUpPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                  <div
                    style={{ width: `${stepUpPct}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>

              {/* BLOCK */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">BLOCK (Reject / Hold)</span>
                  <span className="font-mono text-rose-400 font-bold">
                    {metrics.decisionDistribution.block} ({blockPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                  <div
                    style={{ width: `${blockPct}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('policy')}
              className="w-full py-2 text-xs font-mono font-semibold text-rose-300 bg-rose-950/50 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Cost Matrix & Thresholds</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Flagged Transactions Queue Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono">Recent High-Risk & Flagged Activity</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Live transactions evaluated by cost-aware policy engine awaiting or completing review
            </div>
          </div>
          <button
            onClick={() => onNavigate('explorer')}
            className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Explorer ({recentTransactions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">TX ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Expected Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentTransactions.slice(0, 7).map((tx) => {
                const isBlock = tx.evaluation.decision === 'BLOCK';
                const isStepUp = tx.evaluation.decision === 'STEP-UP';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectTransaction(tx)}
                  >
                    <td className="py-3 px-4 font-medium text-rose-400">{tx.id}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">{tx.customerId}</td>
                    <td className="py-3 px-4 font-bold text-white">${tx.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 capitalize">{tx.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          tx.evaluation.riskScore >= 75
                            ? 'text-rose-400'
                            : tx.evaluation.riskScore >= 50
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {tx.evaluation.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBlock
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : isStepUp
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {tx.evaluation.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">
                      ${(tx.evaluation.expectedCosts?.[tx.evaluation.decision]?.expectedCost ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-400">
                      {tx.investigationStatus.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-rose-400 hover:text-rose-300 text-xs">
                        Inspect &rarr;
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
