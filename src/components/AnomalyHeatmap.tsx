/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Filter,
  Info,
  Clock,
  Layers,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { TransactionRecord } from '../types/fraud.js';

interface AnomalyHeatmapProps {
  transactions?: TransactionRecord[];
  onSelectTransaction?: (tx: TransactionRecord) => void;
}

const CATEGORIES = [
  'Crypto & Assets',
  'E-Commerce Retail',
  'Cross-Border Wire',
  'Travel & Airline',
  'P2P Transfers',
  'Digital Services',
];

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export function AnomalyHeatmap({ transactions = [], onSelectTransaction }: AnomalyHeatmapProps) {
  const [metricMode, setMetricMode] = useState<'anomaly_density' | 'block_count' | 'avg_risk'>('anomaly_density');
  const [selectedAnomalyType, setSelectedAnomalyType] = useState<string>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    cat: string;
    hour: number;
    density: number;
    blocks: number;
    avgRisk: number;
    volume: number;
  } | null>(null);

  // Generate deterministic, realistic anomaly distribution matrix
  // Higher risk at late hours (01:00-05:00) and in high-risk categories (Crypto, Wire)
  const getMatrixData = () => {
    return CATEGORIES.map((cat, catIdx) => {
      return HOURS.map((_, hour) => {
        // Late night spike (1am to 5am)
        const isLateNight = hour >= 1 && hour <= 5;
        // High risk category multiplier
        const catRiskMul = catIdx === 0 ? 1.8 : catIdx === 2 ? 1.6 : catIdx === 3 ? 1.2 : 0.8;
        
        const baseDensity = Math.sin((hour / 24) * Math.PI * 2 - 1.2) * 25 + 35;
        const noise = ((catIdx * 17 + hour * 31) % 23) - 11;
        
        let density = Math.max(2, Math.min(98, Math.round((baseDensity + (isLateNight ? 38 : 0) + noise) * catRiskMul * 0.7)));
        
        // Filter multiplier
        if (selectedAnomalyType === 'velocity' && (hour < 2 || hour > 4)) density = Math.round(density * 0.6);
        if (selectedAnomalyType === 'bot' && !isLateNight) density = Math.round(density * 0.4);
        if (selectedAnomalyType === 'geo' && catIdx !== 2 && catIdx !== 3) density = Math.round(density * 0.5);

        const volume = Math.round(120 + ((catIdx * 43 + hour * 19) % 180));
        const blocks = Math.round((density / 100) * volume * 0.22);
        const avgRisk = Math.round(20 + (density * 0.72));

        return {
          cat,
          hour,
          density,
          blocks,
          avgRisk,
          volume,
        };
      });
    });
  };

  const matrix = getMatrixData();

  // Helper color map based on intensity
  const getCellBg = (density: number) => {
    if (density < 20) return 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60';
    if (density < 45) return 'bg-cyan-950/50 border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/70';
    if (density < 70) return 'bg-amber-950/60 border-amber-800/60 text-amber-300 hover:bg-amber-900/80';
    return 'bg-rose-950/80 border-rose-600/70 text-rose-200 shadow-xs shadow-rose-950/60 hover:bg-rose-900';
  };

  return (
    <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Multi-Dimensional Anomaly Heatmap</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                  REAL-TIME DENSITY MATRIX
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Continuous 24-Hour temporal risk distribution mapped across merchant transaction vectors
              </p>
            </div>
          </div>
        </div>

        {/* Metric Toggles & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMetricMode('anomaly_density')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                metricMode === 'anomaly_density'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Density Index
            </button>
            <button
              onClick={() => setMetricMode('block_count')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                metricMode === 'block_count'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Threat Blocks
            </button>
            <button
              onClick={() => setMetricMode('avg_risk')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                metricMode === 'avg_risk'
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Avg Risk (0-100)
            </button>
          </div>

          <select
            value={selectedAnomalyType}
            onChange={(e) => setSelectedAnomalyType(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-hidden focus:border-rose-500 shadow-xs"
          >
            <option value="all">All Anomaly Vectors</option>
            <option value="velocity">Velocity Spikes (Rapid Fire)</option>
            <option value="bot">Bot & Headless Fingerprints</option>
            <option value="geo">Geo-Distance Mismatches</option>
          </select>
        </div>
      </div>

      {/* Heatmap Grid Visualizer */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[850px] space-y-2">
          {/* Hour Axis Labels */}
          <div className="grid grid-cols-[160px_repeat(24,1fr)] gap-1 text-[10px] font-mono text-slate-500 text-center">
            <div className="text-left font-semibold text-slate-400 pl-2">Category \ Hour</div>
            {HOURS.map((h, i) => (
              <div key={i} className="truncate">
                {i % 3 === 0 ? h.slice(0, 2) : '·'}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {matrix.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-[160px_repeat(24,1fr)] gap-1.5 items-center">
              <div className="text-xs font-mono font-medium text-slate-300 truncate pr-2 pl-2">
                {CATEGORIES[rIdx]}
              </div>

              {row.map((cell, cIdx) => {
                const displayVal =
                  metricMode === 'anomaly_density'
                    ? `${cell.density}%`
                    : metricMode === 'block_count'
                    ? `${cell.blocks}`
                    : `${cell.avgRisk}`;

                return (
                  <motion.div
                    key={cIdx}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    onMouseEnter={() => setHoveredCell(cell)}
                    className={`h-9 rounded-lg border flex items-center justify-center font-mono text-[10px] font-bold cursor-pointer transition-colors duration-150 ${getCellBg(
                      cell.density
                    )}`}
                  >
                    <span>{displayVal}</span>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Legend & Live Cell Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-3 border-t border-slate-800 text-xs font-mono">
        {/* Color Legend */}
        <div className="md:col-span-6 flex items-center gap-3">
          <span className="text-slate-400">Risk Severity:</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              Low (&lt;20%)
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
              Normal (20-45%)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300">
              Elevated (45-70%)
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-950/90 border border-rose-600/80 text-rose-300 font-bold">
              Critical (&ge;70%)
            </span>
          </div>
        </div>

        {/* Interactive Hover Telemetry Inspector */}
        <div className="md:col-span-6 flex items-center justify-end">
          {hoveredCell ? (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-200">
              <span className="text-white font-bold">{hoveredCell.cat}</span>
              <span className="text-slate-500">@</span>
              <span className="text-rose-400 font-bold">{String(hoveredCell.hour).padStart(2, '0')}:00 UTC</span>
              <span className="text-slate-700">|</span>
              <span>Density: <strong className="text-white">{hoveredCell.density}%</strong></span>
              <span className="text-slate-700">|</span>
              <span>Blocked: <strong className="text-rose-400">{hoveredCell.blocks}</strong></span>
              <span className="text-slate-700">|</span>
              <span>Mean Risk: <strong className="text-amber-400">{hoveredCell.avgRisk}/100</strong></span>
            </div>
          ) : (
            <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Hover any matrix cell to inspect temporal attack density & block volumes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
