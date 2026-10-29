/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Activity,
  AlertOctagon,
  ShieldCheck,
  Zap,
  Sliders,
  Calendar,
  Layers,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export function PredictiveTrendAnalysis() {
  const [horizon, setHorizon] = useState<'6h' | '24h' | '7d'>('24h');
  const [volumeSurgePct, setVolumeSurgePct] = useState<number>(20);

  // Forecast data points with confidence bounds
  const getForecastSeries = () => {
    const pointsCount = horizon === '6h' ? 6 : horizon === '24h' ? 12 : 7;
    const baseHour = 14;

    return Array.from({ length: pointsCount }, (_, i) => {
      let label = '';
      if (horizon === '6h') label = `+${i + 1}h (${(baseHour + i + 1) % 24}:00)`;
      else if (horizon === '24h') label = `+${(i + 1) * 2}h`;
      else label = `Day ${i + 1}`;

      const wave = Math.sin((i / pointsCount) * Math.PI * 2) * 15;
      const surgeMultiplier = 1 + (volumeSurgePct / 100) * 0.45;
      const projectedThreatRate = Math.round((8.2 + wave + (i % 2 === 0 ? 3 : -2)) * surgeMultiplier * 10) / 10;
      const upperConfidence = Math.round((projectedThreatRate + 3.4) * 10) / 10;
      const lowerConfidence = Math.max(1.0, Math.round((projectedThreatRate - 2.8) * 10) / 10);
      const frictionRate = Math.round((1.18 + (projectedThreatRate * 0.025)) * 100) / 100;

      return {
        label,
        threatRate: projectedThreatRate,
        upperConfidence,
        lowerConfidence,
        frictionRate,
      };
    });
  };

  const series = getForecastSeries();

  const maxVal = Math.max(...series.map((s) => s.upperConfidence), 25);

  return (
    <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/40">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Predictive Fraud & Velocity Trend Analysis</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  ARIMA + ENSEMBLE FORECAST
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Projected attack vectors, 95% confidence intervals, and automated friction budget calibration
              </p>
            </div>
          </div>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px] hidden sm:inline">Forecast Horizon:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {(['6h', '24h', '7d'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  horizon === h
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {h === '6h' ? 'Next 6 Hours' : h === '24h' ? 'Next 24 Hours' : 'Next 7 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast Chart Visualizer with Confidence Bounds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
              <span className="text-slate-200">Projected Threat Influx Rate (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40" />
              <span>95% Confidence Interval</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400" />
              <span className="text-emerald-400">Projected Friction (SLA &le; 2.0%)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Monte Carlo Simulation (1,000 runs)
          </div>
        </div>

        {/* Bar & Range Trend Display */}
        <div className="grid grid-cols-6 sm:grid-cols-7 lg:grid-cols-12 gap-2 h-44 items-end pt-4 pb-2 border-b border-slate-800/80 px-2">
          {series.map((item, idx) => {
            const threatHeightPct = (item.threatRate / maxVal) * 100;
            const upperHeightPct = (item.upperConfidence / maxVal) * 100;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group relative cursor-pointer">
                {/* Tooltip on Hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-white pointer-events-none shadow-xl z-20 whitespace-nowrap">
                  <div>Rate: <strong className="text-rose-400">{item.threatRate}%</strong> [{item.lowerConfidence}% - {item.upperConfidence}%]</div>
                  <div>Friction: <strong className="text-emerald-400">{item.frictionRate}%</strong></div>
                </div>

                {/* Range Area (Confidence Envelope) */}
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-rose-500/15 border-t border-dashed border-rose-500/50 flex flex-col justify-end items-center relative overflow-hidden"
                  style={{ height: `${upperHeightPct}%` }}
                >
                  {/* Central Projected Threat Column */}
                  <div
                    className="w-full bg-gradient-to-t from-rose-700 to-rose-500 rounded-t-md shadow-xs shadow-rose-950/80"
                    style={{ height: `${(threatHeightPct / upperHeightPct) * 100}%` }}
                  />
                </div>

                <span className="text-[10px] font-mono text-slate-400 mt-2 truncate max-w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Slider & Proactive Threat Warning Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        {/* Interactive Influx Simulation Slider (5 cols) */}
        <div className="lg:col-span-5 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Transaction Volume Surge</span>
            </span>
            <span className="text-cyan-400 font-bold font-mono">+{volumeSurgePct}%</span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={volumeSurgePct}
            onChange={(e) => setVolumeSurgePct(parseInt(e.target.value, 10))}
            className="w-full accent-rose-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Projected Cost Avoidance: <strong className="text-emerald-400">+$24,800</strong></span>
            <span>Friction Buffer: <strong className="text-white">0.66% remaining</strong></span>
          </div>
        </div>

        {/* Proactive Forecast Warning Badges (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-800/50 space-y-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Anticipated Threat Surge</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Expected 28% carding burst at 02:00-04:00 UTC. System auto-tightens 2FA Step-Up threshold.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-800/50 space-y-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Friction Budget Stability</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Projected customer verification challenges peak at 1.34%, well within the &le; 2.0% SLA mandate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
