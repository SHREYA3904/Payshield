/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TransactionRecord, InvestigationStatus } from '../types/fraud.js';
import { ShapWaterfallBar } from './Charts.js';
import {
  X,
  Sparkles,
  ShieldAlert,
  Clock,
  Send,
  Tag,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
  onUpdateInvestigation?: (
    id: string,
    status: InvestigationStatus,
    note?: string,
    evidenceTag?: string
  ) => void;
}

export function TransactionDetailModal({
  transaction,
  onClose,
  onUpdateInvestigation,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const [noteText, setNoteText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [saving, setSaving] = useState(false);

  const ev = transaction.evaluation;
  const action = ev?.decision || 'ALLOW';
  const score = ev?.riskScore ?? 0;
  const prob = ev?.fraudProbability ?? 0;
  const isBlock = action === 'BLOCK';
  const isStepUp = action === 'STEP-UP';

  const handleAction = async (status: InvestigationStatus) => {
    if (!onUpdateInvestigation) return;
    setSaving(true);
    try {
      await onUpdateInvestigation(
        transaction.id,
        status,
        noteText.trim() || undefined,
        selectedTag || undefined
      );
      setNoteText('');
      setSelectedTag('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto font-sans text-slate-100">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-300 font-mono text-xs font-bold">
              TX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {transaction.id}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(transaction.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                <span>Model: {ev?.modelVersion || 'PayShield Ensemble'}</span>
                <span>·</span>
                <span>{ev?.inferenceLatencyMs || 2.1} ms latency</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Top Banner: Decision & Risk Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-slate-400 font-mono mb-1">Policy Outcome</div>
              <div
                className={`text-xl font-bold font-mono tracking-tight ${
                  isBlock ? 'text-rose-400' : isStepUp ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {action}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {isBlock ? 'Rejected / Suspended' : isStepUp ? '2FA Step-Up Challenge' : 'Approved'}
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-mono mb-1">Calibrated Risk Score</div>
              <div className="text-xl font-bold font-mono text-white">
                {score.toFixed(0)}
                <span className="text-sm font-normal text-slate-500"> / 100</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Fraud Prob: {(prob * 100).toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-mono mb-1">Investigation Status</div>
              <div className="text-base font-bold capitalize text-white font-mono">
                {transaction.investigationStatus.replace('_', ' ')}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {transaction.assignedAnalyst ? `Assigned: ${transaction.assignedAnalyst}` : 'Unassigned'}
              </div>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div>
            <div className="font-bold text-white text-sm mb-3 font-mono">Transaction Attributes</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">Amount</span>
                <span className="font-bold text-white text-sm">
                  ${transaction.amount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Customer ID</span>
                <span className="text-slate-300">{transaction.customerId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Payment Method</span>
                <span className="capitalize text-slate-300">
                  {transaction.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Merchant Category</span>
                <span className="text-slate-300 truncate block">{transaction.merchantCategory}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Geo Route</span>
                <span className="text-slate-300">
                  {transaction.customerCountry} &rarr; {transaction.merchantCountry}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">IP Distance</span>
                <span className="text-slate-300">{transaction.ipDistanceKm} km</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Device & Network</span>
                <span className="text-slate-300 capitalize">
                  {transaction.deviceType} {transaction.isVpnOrProxy ? '(VPN)' : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Velocity</span>
                <span className="text-slate-300">
                  {transaction.velocity1h} tx/hr · {transaction.velocity24h} tx/day
                </span>
              </div>
            </div>
          </div>

          {/* Governing Rule & Cost Matrix Comparison */}
          <div className="space-y-3">
            <div className="font-bold text-white text-sm font-mono">Policy Cost Minimization Breakdown</div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-300 font-mono">
              <span className="font-semibold text-rose-400">Triggered Policy Rule: </span>
              {ev?.policyRuleTriggered || 'Cost Matrix Optimization'}
            </div>

            {ev?.expectedCosts && (
              <div className="grid grid-cols-3 gap-3">
                {(['ALLOW', 'STEP-UP', 'BLOCK'] as const).map((a) => {
                  const evalObj = ev.expectedCosts[a];
                  const isSelected = action === a;
                  return (
                    <div
                      key={a}
                      className={`p-3 rounded-xl border ${
                        isSelected
                          ? 'border-rose-500 bg-rose-950/40 text-white'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-semibold mb-1">
                        <span>{a}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold font-mono my-0.5 text-white">
                        ${evalObj?.expectedCost?.toFixed(2) || '0.00'}
                      </div>
                      {evalObj?.costBreakdown && (
                        <div className="space-y-0.5 text-[10px] font-mono opacity-80 pt-1 border-t border-slate-800">
                          <div>Direct Fraud Loss: ${evalObj.costBreakdown.directFraudLoss}</div>
                          <div>FP Churn Loss: ${evalObj.costBreakdown.falsePositiveLoss}</div>
                          <div>Overhead: ${evalObj.costBreakdown.verificationFrictionCost + evalObj.costBreakdown.operationalOverhead}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SHAP Feature Attributions */}
          {ev?.shapValues && (
            <div>
              <div className="font-bold text-white text-sm mb-2 font-mono">SHAP Feature Explanations</div>
              <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/60">
                <ShapWaterfallBar
                  shapValues={ev.shapValues}
                  baseValue={ev.baseValue}
                  finalScore={score}
                />
              </div>
            </div>
          )}

          {/* AI Grounded Explanation */}
          {ev?.aiExplanation && (
            <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs font-mono">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>AI Auditor Narrative (Gemini 3.8 Flash Grounded)</span>
              </div>
              <div className="text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                {ev.aiExplanation}
              </div>
            </div>
          )}

          {/* Analyst Feedback & Triage Section */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 font-mono">
            <div className="font-bold text-white text-sm">Analyst Feedback & Investigation Log</div>

            {transaction.investigationNotes && transaction.investigationNotes.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {transaction.investigationNotes.map((note, i) => (
                  <div key={i} className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                    {note}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Add investigation finding or context..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-hidden"
              />

              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300"
              >
                <option value="">Evidence Tag (Optional)</option>
                <option value="BOT_SIGNATURE">Bot Signature</option>
                <option value="ACCOUNT_TAKEOVER">Account Takeover</option>
                <option value="FALSE_POSITIVE_OVERRIDE">False Positive Override</option>
                <option value="STOLEN_CARD">Stolen Card Dispute</option>
                <option value="TRAVEL_EXCEPTION">Travel Exception</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                disabled={saving}
                onClick={() => handleAction('confirmed_legitimate')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Legitimate
              </button>
              <button
                disabled={saving}
                onClick={() => handleAction('confirmed_fraud')}
                className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/80 border border-rose-800/60 hover:bg-rose-900 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Fraud
              </button>
              <button
                disabled={saving}
                onClick={() => handleAction('under_review')}
                className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/60 hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
              >
                Keep Under Review
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
