/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TransactionRecord } from '../types/fraud.js';
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface ExplorerViewProps {
  transactions: TransactionRecord[];
  totalCount: number;
  onSelectTransaction: (tx: TransactionRecord) => void;
  onRefresh?: () => void;
}

export function ExplorerView({
  transactions,
  totalCount,
  onSelectTransaction,
}: ExplorerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Filter in client for instantaneous responsiveness
  const filtered = transactions.filter((tx) => {
    const action = tx.evaluation?.decision || 'ALLOW';
    const riskLevel = tx.evaluation?.riskLevel || 'LOW';

    if (decisionFilter !== 'ALL' && action !== decisionFilter) {
      return false;
    }
    if (riskFilter !== 'ALL' && riskLevel !== riskFilter) {
      return false;
    }
    if (statusFilter !== 'ALL' && tx.investigationStatus !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        tx.id.toLowerCase().includes(q) ||
        tx.customerId.toLowerCase().includes(q) ||
        tx.merchantCategory.toLowerCase().includes(q) ||
        tx.customerCountry.toLowerCase().includes(q) ||
        tx.merchantCountry.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    window.location.href = '/api/reports/export-csv';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Pay<span className="text-rose-500">Shield</span> Transaction Ledger & Explorer
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>{filtered.length} Filtered Records</span>
            <span>·</span>
            <span>{totalCount} Stored in System</span>
            <span>·</span>
            <span>Dual LightGBM & XGBoost Scored</span>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Customer, Category, or Country..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <select
              value={decisionFilter}
              onChange={(e) => {
                setDecisionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs border border-slate-800 rounded-xl bg-slate-950 text-slate-300 focus:outline-hidden"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOW">ALLOW</option>
              <option value="STEP-UP">STEP-UP</option>
              <option value="BLOCK">BLOCK</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs border border-slate-800 rounded-xl bg-slate-950 text-slate-300 focus:outline-hidden"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">LOW (&lt;20)</option>
              <option value="MEDIUM">MEDIUM (20-50)</option>
              <option value="HIGH">HIGH (50-75)</option>
              <option value="CRITICAL">CRITICAL (&ge;75)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs border border-slate-800 rounded-xl bg-slate-950 text-slate-300 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="confirmed_fraud">Confirmed Fraud</option>
              <option value="confirmed_legitimate">Confirmed Legitimate</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Prob</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Policy Action</th>
                <th className="py-3 px-4">Ground Truth</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const ev = tx.evaluation;
                  const action = ev?.decision || 'ALLOW';
                  const score = ev?.riskScore ?? 0;
                  const prob = ev?.fraudProbability ?? 0;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-white">{tx.id}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(tx.timestamp).toLocaleDateString()}{' '}
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{tx.customerId}</td>
                      <td className="py-3 px-4 font-bold text-white">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-400">{tx.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-3 px-4 truncate max-w-[140px] text-slate-300">{tx.merchantCategory}</td>
                      <td className="py-3 px-4">
                        {(prob * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            score >= 70
                              ? 'text-rose-400'
                              : score >= 35
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {score.toFixed(0)}
                        </span>
                        <span className="text-slate-500">/100</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            action === 'BLOCK'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                              : action === 'STEP-UP'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tx.actualOutcome === 'fraud' ? (
                          <span className="text-rose-400 font-bold">Fraud</span>
                        ) : tx.actualOutcome === 'legitimate' ? (
                          <span className="text-emerald-400">Legitimate</span>
                        ) : (
                          <span className="text-slate-500">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400 capitalize">
                          {tx.investigationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-rose-400 hover:text-rose-300 font-bold">Inspect &rarr;</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 disabled:opacity-40 cursor-pointer text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 disabled:opacity-40 cursor-pointer text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
