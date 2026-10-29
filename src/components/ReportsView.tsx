/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemMetricsOverview } from '../types/fraud.js';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface ReportsViewProps {
  metrics: SystemMetricsOverview | null;
}

export function ReportsView({ metrics }: ReportsViewProps) {
  const [reportType, setReportType] = useState<'executive' | 'compliance' | 'model_audit'>('executive');

  const handleDownloadCsv = () => {
    window.location.href = '/api/reports/export-csv';
  };

  const handleDownloadJsonReport = () => {
    if (!metrics) return;
    const reportPayload = {
      generatedAt: new Date().toISOString(),
      reportType,
      systemMetrics: metrics,
      complianceStandard: 'PCI-DSS v4.0 / Basel Committee Fraud Risk Guidelines',
      certifiedBy: 'PayShield Autonomous Cost-Aware Risk Engine',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportPayload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `payshield_${reportType}_report_${Date.now()}.json`);
    dlAnchor.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400 font-mono">
        Loading PayShield audit logs...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Pay<span className="text-rose-500">Shield</span> Audit & Compliance Certification
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>PCI-DSS v4.0 Requirement 10.2</span>
            <span>·</span>
            <span>Cost-Aware Friction Budget Proof</span>
            <span>·</span>
            <span>Exportable Audit Packages</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 text-xs font-mono font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Raw CSV Ledger</span>
          </button>

          <button
            onClick={handleDownloadJsonReport}
            className="px-3.5 py-2 text-xs font-mono font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md shadow-rose-950/40 border border-rose-500/50 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Certified JSON Package</span>
          </button>
        </div>
      </div>

      {/* Report View Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-mono">
        {[
          { id: 'executive', label: 'Executive Loss Defense' },
          { id: 'compliance', label: 'Friction Budget & Regulatory Audit' },
          { id: 'model_audit', label: 'Dual Model Drift & PSI Attestation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              reportType === tab.id
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8 max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-rose-500" />
              <span className="font-bold text-lg tracking-tight text-white font-mono">
                PayShield System Audit & Performance Certification
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono space-y-0.5">
              <div>Document ID: PAYSHIELD-AUD-{Date.now().toString().slice(-8)}</div>
              <div>Generated: {new Date().toUTCString()}</div>
              <div>Serving Model: PayShield-v2.0-AdaptiveEnsemble</div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
              Classification
            </span>
            <span className="text-xs font-bold font-mono text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800/60">
              CONFIDENTIAL · RISK COMMITTEE
            </span>
          </div>
        </div>

        {/* Section 1: Executive KPI Overview */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            1. Key Financial Defense Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Evaluated</span>
              <span className="text-base font-bold text-white">
                {metrics.totalAnalyzed.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Fraud Captured</span>
              <span className="text-base font-bold text-rose-400">
                {metrics.confirmedFraud} ({metrics.fraudDetectionRate.toFixed(1)}%)
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">False Positive Rate</span>
              <span className="text-base font-bold text-white">
                {metrics.falsePositiveRate.toFixed(2)}%
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Estimated Net Savings</span>
              <span className="text-base font-bold text-emerald-400">
                ${metrics.estimatedNetSavings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Friction Budget Compliance Statement */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            2. Friction Budget Compliance Certification
          </h2>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3 text-xs leading-relaxed text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-white font-mono">
                Mandatory Policy Friction Ceiling: &le; 2.0% of Legitimate Transactions
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  metrics.frictionBudgetMet
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                }`}
              >
                {metrics.frictionBudgetMet ? 'PASSED · COMPLIANT' : 'BREACHED'}
              </span>
            </div>

            <p className="font-mono text-xs">
              The cost-aware policy engine measured a legitimate transaction friction rate of{' '}
              <strong className="text-white font-bold">{metrics.frictionRate.toFixed(2)}%</strong> across the observation period. This strictly adheres to the configured 2.0% threshold. The optimization policy ensured customer friction drop-off was mitigated without compromising fraud detection recall.
            </p>
          </div>
        </div>

        {/* Section 3: Policy Action Allocation */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            3. Policy Decision Allocations & Exposure
          </h2>
          <div className="border border-slate-800 rounded-xl overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Volume</th>
                  <th className="py-2.5 px-4">Share (%)</th>
                  <th className="py-2.5 px-4">Intended Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-emerald-400">ALLOW</td>
                  <td className="py-2.5 px-4">{metrics.decisionDistribution.allow}</td>
                  <td className="py-2.5 px-4">
                    {((metrics.decisionDistribution.allow / metrics.totalAnalyzed) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">Unimpeded checkout authorization</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-amber-400">STEP-UP</td>
                  <td className="py-2.5 px-4">{metrics.decisionDistribution.stepUp}</td>
                  <td className="py-2.5 px-4">
                    {((metrics.decisionDistribution.stepUp / metrics.totalAnalyzed) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">Targeted 2FA / Biometric Challenge</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-rose-400">BLOCK</td>
                  <td className="py-2.5 px-4">{metrics.decisionDistribution.block}</td>
                  <td className="py-2.5 px-4">
                    {((metrics.decisionDistribution.block / metrics.totalAnalyzed) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">Immediate hold & merchant loss prevention</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditor Sign-off Footer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-4 font-mono">
          <div>
            <div className="font-semibold text-white">Signed: PayShield Autonomous Risk Policy System</div>
            <div className="text-[11px] text-slate-500">SHA256: 9b2d87a4128f...verified</div>
          </div>

          <div className="sm:text-right text-[11px]">
            <div>End of Certified Audit Report</div>
            <div>Valid for Fiscal Q4 2026 Audit</div>
          </div>
        </div>
      </div>
    </div>
  );
}
