/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TransactionInput } from '../types/fraud.js';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function CsvUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: CsvUploadModalProps) {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<TransactionInput[]>([]);
  const [invalidRows, setInvalidRows] = useState<Array<{ rowIdx: number; reason: string }>>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState<number | null>(null);

  const sampleCsv = `amount,customerId,paymentMethod,merchantCategory,customerCountry,merchantCountry,ipDistanceKm,deviceType,isVpnOrProxy,velocity1h,velocity24h,avgPastAmount,failedAttempts24h,accountAgeDays
125.50,CUST-7711,credit_card,Electronics,US,US,12,mobile,false,1,2,95,0,340
850.00,CUST-9923,wire_transfer,Crypto Exchange,US,RU,6800,desktop,true,3,5,110,2,4
45.00,CUST-1042,debit_card,Supermarket,US,US,8,mobile,false,1,1,42,0,510
390.00,CUST-4412,credit_card,Digital Services,US,GB,5200,bot_emulated,true,7,16,25,3,1
1200.00,CUST-8832,crypto,Crypto Exchange,US,SG,11200,desktop,true,2,4,80,1,3`;

  const parseCsvContent = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setInvalidRows([{ rowIdx: 0, reason: 'CSV must contain a header and at least 1 data row.' }]);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const required = ['amount', 'customerId', 'paymentMethod'];
    const missing = required.filter((r) => !headers.includes(r));

    if (missing.length > 0) {
      setInvalidRows([{ rowIdx: 0, reason: `Missing required columns: ${missing.join(', ')}` }]);
      setParsedRows([]);
      return;
    }

    const valid: TransactionInput[] = [];
    const invalid: Array<{ rowIdx: number; reason: string }> = [];
    const seenCustAndAmt = new Set<string>();
    let dupes = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] ?? '';
      });

      const amt = parseFloat(row.amount);
      if (isNaN(amt) || amt <= 0) {
        invalid.push({ rowIdx: i, reason: `Invalid amount: "${row.amount}"` });
        continue;
      }

      if (!row.customerId) {
        invalid.push({ rowIdx: i, reason: 'Missing customerId' });
        continue;
      }

      const dupKey = `${row.customerId}_${amt}_${row.merchantCategory}`;
      if (seenCustAndAmt.has(dupKey)) {
        dupes++;
        invalid.push({ rowIdx: i, reason: 'Duplicate transaction detected in dataset batch' });
        continue;
      }
      seenCustAndAmt.add(dupKey);

      const parsedItem: TransactionInput = {
        amount: amt,
        customerId: row.customerId,
        paymentMethod: (row.paymentMethod as any) || 'credit_card',
        merchantCategory: row.merchantCategory || 'General Retail',
        customerCountry: (row.customerCountry || 'US').toUpperCase(),
        merchantCountry: (row.merchantCountry || 'US').toUpperCase(),
        ipDistanceKm: parseInt(row.ipDistanceKm, 10) || 10,
        deviceType: (row.deviceType as any) || 'mobile',
        isVpnOrProxy: row.isVpnOrProxy === 'true',
        velocity1h: parseInt(row.velocity1h, 10) || 1,
        velocity24h: parseInt(row.velocity24h, 10) || 2,
        avgPastAmount: parseFloat(row.avgPastAmount) || 50,
        failedAttempts24h: parseInt(row.failedAttempts24h, 10) || 0,
        accountAgeDays: parseInt(row.accountAgeDays, 10) || 180,
      };

      valid.push(parsedItem);
    }

    setParsedRows(valid);
    setInvalidRows(invalid);
    setDuplicateCount(dupes);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      parseCsvContent(content);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setRawText(sampleCsv);
    parseCsvContent(sampleCsv);
  };

  const submitBatch = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch('/api/transactions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: parsedRows }),
      });
      if (res.ok) {
        const data = await res.json();
        setUploadSuccessCount(data.totalProcessed);
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Batch upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans text-slate-100">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-950 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                Batch CSV Ingestion & Preprocessing
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Validated schema with duplicate and missing-value filters
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
          {uploadSuccessCount !== null ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <div className="text-base font-bold text-white">
                Successfully Ingested {uploadSuccessCount} Transactions!
              </div>
              <p className="text-xs text-slate-400">
                All records evaluated through model and cost-aware policy. Updating ledger...
              </p>
            </div>
          ) : (
            <>
              {/* File Drop / Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                <div>
                  <div className="font-semibold text-white">Upload CSV Dataset</div>
                  <div className="text-[11px] text-slate-400">
                    Required: amount, customerId, paymentMethod, category, countries...
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadSample}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                  >
                    Load Sample CSV
                  </button>
                  <label className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer transition-colors shadow-sm">
                    Browse File
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Validation Summary Bar */}
              {(parsedRows.length > 0 || invalidRows.length > 0) && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px]">
                  <span className="text-emerald-400 font-semibold">
                    Valid Records: {parsedRows.length}
                  </span>
                  <span className="text-rose-400 font-semibold">
                    Rejected / Invalid: {invalidRows.length}
                  </span>
                  <span className="text-amber-400 font-semibold">
                    Duplicates: {duplicateCount}
                  </span>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div>
                  <div className="font-bold text-white mb-2">
                    Validated Preview ({parsedRows.length} records ready for evaluation)
                  </div>
                  <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-[220px] bg-slate-900/60">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Customer</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Route</th>
                          <th className="py-2 px-3">VPN</th>
                          <th className="py-2 px-3">Velocity 1h</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono text-rose-300">{row.customerId}</td>
                            <td className="py-2 px-3 font-mono font-bold text-white">${row.amount.toFixed(2)}</td>
                            <td className="py-2 px-3">{row.paymentMethod}</td>
                            <td className="py-2 px-3 font-mono">
                              {row.customerCountry} &rarr; {row.merchantCountry}
                            </td>
                            <td className="py-2 px-3">{row.isVpnOrProxy ? 'Yes' : 'No'}</td>
                            <td className="py-2 px-3 font-mono">{row.velocity1h}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rejected Rows List */}
              {invalidRows.length > 0 && (
                <div className="p-3 rounded-xl border border-rose-900/60 bg-rose-950/40 space-y-1">
                  <div className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Rejected Records Summary</span>
                  </div>
                  <ul className="text-[11px] text-rose-400 list-disc list-inside space-y-0.5">
                    {invalidRows.slice(0, 4).map((err, idx) => (
                      <li key={idx}>
                        Row {err.rowIdx}: {err.reason}
                      </li>
                    ))}
                    {invalidRows.length > 4 && <li>...and {invalidRows.length - 4} more rejected</li>}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {uploadSuccessCount === null && (
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Transactions will be assigned unique IDs and evaluated in real-time.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={parsedRows.length === 0 || uploading}
                onClick={submitBatch}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
              >
                {uploading ? 'Processing & Ingesting...' : `Ingest ${parsedRows.length} Transactions`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
