/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TransactionRecord, InvestigationStatus } from '../types/fraud.js';
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  AlertTriangle,
  Tag,
  Link,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { ShapWaterfallBar } from './Charts.js';

interface InvestigationViewProps {
  transactions: TransactionRecord[];
  onUpdateInvestigation: (
    id: string,
    status: InvestigationStatus,
    note?: string,
    evidenceTag?: string
  ) => Promise<void>;
  onSelectTransaction: (tx: TransactionRecord) => void;
}

export function InvestigationView({
  transactions,
  onUpdateInvestigation,
  onSelectTransaction,
}: InvestigationViewProps) {
  // Filter for cases that are under review, pending, or flagged
  const queue = transactions.filter(
    (t) =>
      t.investigationStatus === 'pending' ||
      t.investigationStatus === 'under_review' ||
      t.evaluation.decision === 'BLOCK' ||
      t.evaluation.decision === 'STEP-UP'
  );

  const [selectedCaseId, setSelectedCaseId] = useState<string>(queue[0]?.id || '');
  const activeCase = transactions.find((t) => t.id === selectedCaseId) || queue[0];

  const [analystNote, setAnalystNote] = useState('');
  const [evidenceTag, setEvidenceTag] = useState('ACCOUNT_TAKEOVER');
  const [submitting, setSubmitting] = useState(false);

  // Find related transactions by same customerId or shared IP distance / country
  const relatedCases = activeCase
    ? transactions.filter(
        (t) =>
          t.id !== activeCase.id &&
          (t.customerId === activeCase.customerId ||
            (t.ipDistanceKm === activeCase.ipDistanceKm && t.merchantCountry === activeCase.merchantCountry))
      )
    : [];

  const handleTriage = async (status: InvestigationStatus) => {
    if (!activeCase) return;
    setSubmitting(true);
    try {
      await onUpdateInvestigation(
        activeCase.id,
        status,
        analystNote.trim() || undefined,
        evidenceTag || undefined
      );
      setAnalystNote('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Fraud Analyst Investigation & Triage Workspace
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>{queue.length} Flagged Queue Items</span>
            <span aria-hidden="true">·</span>
            <span>Ground Truth Feedback Loop</span>
            <span aria-hidden="true">·</span>
            <span>Entity Relationship Clustering</span>
          </div>
        </div>


      </div>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Triage Case List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[750px]">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono">Flagged Cases Awaiting Review</span>
            <span className="text-xs font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
              {queue.length} cases
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1">
            {queue.map((tx) => {
              const isSelected = activeCase?.id === tx.id;
              const isBlock = tx.evaluation.decision === 'BLOCK';

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedCaseId(tx.id)}
                  className={`p-3.5 transition-all cursor-pointer text-xs font-mono ${
                    isSelected
                      ? 'bg-slate-800/90 border-l-4 border-rose-500 shadow-inner'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{tx.id}</span>
                    <span className="font-bold text-emerald-400">
                      ${tx.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>{tx.customerId}</span>
                    <span
                      className={`font-semibold ${
                        tx.evaluation.riskScore >= 75
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      Risk {tx.evaluation.riskScore}/100
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        isBlock
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {tx.evaluation.decision}
                    </span>
                    <span className="capitalize text-slate-400">
                      {tx.investigationStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Investigation Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeCase ? (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100">
              {/* Dossier Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold font-mono text-white">
                      Case File: {activeCase.id}
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      Timestamp: {new Date(activeCase.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                    <span>Customer: <strong className="text-white">{activeCase.customerId}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Account Age: <strong className="text-white">{activeCase.accountAgeDays} days</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Payment: <strong className="text-white">{activeCase.paymentMethod}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">Transaction Amount</div>
                  <div className="text-2xl font-bold font-mono text-white">
                    ${activeCase.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Behavioral Indicators Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px] font-mono">Route Separation</span>
                  <span className="font-mono font-bold text-white">
                    {activeCase.customerCountry} &rarr; {activeCase.merchantCountry} ({activeCase.ipDistanceKm} km)
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px] font-mono">Device & Network</span>
                  <span className="font-medium text-white capitalize font-mono">
                    {activeCase.deviceType} {activeCase.isVpnOrProxy ? '(Proxy/VPN)' : ''}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px] font-mono">Velocity Window</span>
                  <span className="font-mono font-bold text-white">
                    {activeCase.velocity1h} tx/hr · {activeCase.velocity24h} tx/day
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px] font-mono">Failed Auth (24h)</span>
                  <span className="font-mono font-bold text-rose-400">
                    {activeCase.failedAttempts24h} retries
                  </span>
                </div>
              </div>

              {/* SHAP Feature Contribution Waterfall */}
              <div>
                <div className="text-xs font-bold text-white font-mono mb-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-rose-400" />
                  <span>Model Evidence & Feature Attributions (SHAP)</span>
                </div>
                <div className="p-4 border border-slate-800 rounded-xl bg-slate-950/80 shadow-inner">
                  <ShapWaterfallBar
                    shapValues={activeCase.evaluation.shapValues}
                    baseValue={activeCase.evaluation.baseValue}
                    finalScore={activeCase.evaluation.riskScore}
                  />
                </div>
              </div>

              {/* Related Transactions Clustering (Same customer / entity ring) */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white font-mono mb-2">
                  <div className="flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-slate-400" />
                    <span>Associated Customer Transactions ({relatedCases.length} records)</span>
                  </div>
                  <span className="text-slate-400 font-normal">Identified by Customer ID</span>
                </div>

                {relatedCases.length === 0 ? (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono text-center">
                    No other transactions recorded for {activeCase.customerId}.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">TX ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Risk</th>
                          <th className="py-2.5 px-3">Decision</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {relatedCases.slice(0, 4).map((rel) => (
                          <tr
                            key={rel.id}
                            onClick={() => setSelectedCaseId(rel.id)}
                            className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            <td className="py-2 px-3 font-medium text-rose-400">{rel.id}</td>
                            <td className="py-2 px-3 text-slate-400">
                              {new Date(rel.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 font-semibold text-white">${rel.amount.toFixed(2)}</td>
                            <td className="py-2 px-3">{rel.evaluation.riskScore}/100</td>
                            <td className="py-2 px-3 font-bold text-slate-100">{rel.evaluation.decision}</td>
                            <td className="py-2 px-3 capitalize text-slate-400">{rel.investigationStatus}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Investigation History & Analyst Findings */}
              {activeCase.investigationNotes && activeCase.investigationNotes.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-white font-mono mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Case Notes & Triage Trail</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeCase.investigationNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-300"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Triage Action Panel (Feedback loop to model) */}
              <div className="p-5 rounded-2xl border border-slate-700/80 bg-slate-950/90 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">
                    Record Ground Truth Feedback & Classification
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Updates training validation baseline
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-medium mb-1.5 font-mono">
                      Evidence Taxonomy Tag
                    </label>
                    <select
                      value={evidenceTag}
                      onChange={(e) => setEvidenceTag(e.target.value)}
                      style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-rose-500 shadow-sm cursor-pointer"
                    >
                      <option value="ACCOUNT_TAKEOVER" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>Account Takeover (ATO)</option>
                      <option value="BOT_CARDING_ATTACK" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>Automated Carding Bot</option>
                      <option value="STOLEN_CARD_CREDENTIALS" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>Stolen Card / Identity</option>
                      <option value="FALSE_POSITIVE_OVERRIDE" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>False Positive Override (Legitimate)</option>
                      <option value="VIP_TRAVEL_EXCEPTION" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>VIP Travel Exception</option>
                      <option value="FRICTION_DROPOFF" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>Friction Drop-off / Abandonment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-medium mb-1.5 font-mono">
                      Analyst Investigation Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cardholder confirmed unauthorized remote session from London..."
                      value={analystNote}
                      onChange={(e) => setAnalystNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:ring-1 focus:ring-rose-500 focus:outline-hidden shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Select confirmed outcome to feed model retraining loop:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={submitting}
                      onClick={() => handleTriage('confirmed_legitimate')}
                      className="px-3.5 py-2 text-xs font-mono font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-700/60 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Confirm Legitimate
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => handleTriage('confirmed_fraud')}
                      className="px-3.5 py-2 text-xs font-mono font-semibold text-rose-300 bg-rose-950/80 hover:bg-rose-900/90 border border-rose-700/60 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Confirm Fraud
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => handleTriage('unresolved')}
                      className="px-3 py-2 text-xs font-mono font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Mark Unresolved
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 font-mono bg-slate-900/80 border border-slate-800 rounded-2xl">
              No case currently selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
