/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export function Sparkline({
  data,
  height = 40,
  color = '#2563eb',
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 140;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function TrendBarChart({
  data,
  height = 180,
}: {
  data: Array<{ label: string; valueA: number; valueB: number }>;
  height?: number;
}) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => Math.max(d.valueA, d.valueB)), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 w-full pt-4" style={{ height }}>
        {data.map((item, idx) => {
          const hA = Math.round((item.valueA / maxVal) * (height - 30));
          const hB = Math.round((item.valueB / maxVal) * (height - 30));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full flex items-end justify-center gap-1 h-full">
                <div
                  style={{ height: `${Math.max(hA, 4)}px` }}
                  className="w-1/2 bg-slate-300 dark:bg-slate-700 rounded-t transition-all group-hover:bg-slate-400"
                  title={`Volume: ${item.valueA}`}
                />
                <div
                  style={{ height: `${Math.max(hB, 4)}px` }}
                  className="w-1/2 bg-rose-500 rounded-t transition-all group-hover:bg-rose-600"
                  title={`Fraud: ${item.valueB}`}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-xs" />
          <span>Total Transactions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-rose-500 rounded-xs" />
          <span>Fraud Detected</span>
        </div>
      </div>
    </div>
  );
}

export function ConfusionMatrixView({
  tp,
  fp,
  tn,
  fn,
}: {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}) {
  const total = tp + fp + tn + fn || 1;
  const tpPct = ((tp / total) * 100).toFixed(1);
  const fpPct = ((fp / total) * 100).toFixed(1);
  const tnPct = ((tn / total) * 100).toFixed(1);
  const fnPct = ((fn / total) * 100).toFixed(1);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-[80px_1fr_1fr] gap-2 text-center text-xs">
        <div />
        <div className="font-semibold text-slate-600 py-1">Pred: Fraud</div>
        <div className="font-semibold text-slate-600 py-1">Pred: Legit</div>

        <div className="flex items-center justify-end pr-2 font-semibold text-slate-600">
          Actual: Fraud
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-emerald-800">
          <div className="text-lg font-bold font-mono">{tp}</div>
          <div className="text-[11px] font-medium">True Positive ({tpPct}%)</div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded p-3 text-rose-800">
          <div className="text-lg font-bold font-mono">{fn}</div>
          <div className="text-[11px] font-medium">False Negative ({fnPct}%)</div>
        </div>

        <div className="flex items-center justify-end pr-2 font-semibold text-slate-600">
          Actual: Legit
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-amber-800">
          <div className="text-lg font-bold font-mono">{fp}</div>
          <div className="text-[11px] font-medium">False Positive ({fpPct}%)</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-blue-800">
          <div className="text-lg font-bold font-mono">{tn}</div>
          <div className="text-[11px] font-medium">True Negative ({tnPct}%)</div>
        </div>
      </div>
    </div>
  );
}

export function RocCurveSvg({
  auc = 0.978,
  height = 200,
}: {
  auc?: number;
  height?: number;
}) {
  const width = 280;
  // Synthetic points approximating ROC curve with AUC ~0.98
  const points = [
    [0, 200],
    [5, 120],
    [15, 60],
    [30, 30],
    [60, 15],
    [120, 8],
    [200, 3],
    [280, 0],
  ];

  const pathD = points.reduce(
    (acc, [x, y], idx) => (idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`),
    ''
  );

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="border-l border-b border-slate-300">
        {/* Baseline diagonal */}
        <line x1="0" y1="200" x2="280" y2="0" stroke="#cbd5e1" strokeDasharray="4 4" />
        {/* ROC curve */}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      </svg>
      <div className="flex justify-between w-[280px] text-[10px] text-slate-500 mt-1 font-mono">
        <span>FPR: 0.0</span>
        <span>AUC = {auc.toFixed(3)}</span>
        <span>FPR: 1.0</span>
      </div>
    </div>
  );
}

export function ShapWaterfallBar({
  shapValues,
  baseValue = 0.025,
  finalScore = 82,
}: {
  shapValues: Array<{ feature: string; contribution: number; value: any; description: string }>;
  baseValue?: number;
  finalScore?: number;
}) {
  if (!shapValues || shapValues.length === 0) return null;
  const maxAbs = Math.max(...shapValues.map((s) => Math.abs(s.contribution)), 1);

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span>Baseline Prior: {(baseValue * 100).toFixed(1)}%</span>
        <span>Final Calibrated Score: {finalScore}/100</span>
      </div>
      {shapValues.map((s, idx) => {
        const isPos = s.contribution > 0;
        const widthPct = Math.min(100, (Math.abs(s.contribution) / maxAbs) * 100);

        return (
          <div key={idx} className="group relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-800 truncate max-w-[240px]">
                {s.feature}
              </span>
              <span
                className={`font-mono text-xs font-semibold ${
                  isPos ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {isPos ? '+' : ''}
                {s.contribution.toFixed(2)} log-odds
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
              <div
                style={{ width: `${widthPct}%` }}
                className={`h-full rounded-full transition-all ${
                  isPos ? 'bg-rose-500' : 'bg-emerald-500 ml-auto'
                }`}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{s.description}</div>
          </div>
        );
      })}
    </div>
  );
}

export function RiskGauge({
  score,
  size = 180,
}: {
  score: number;
  size?: number;
}) {
  const radius = 68;
  const strokeWidth = 12;
  const cx = size / 2;
  const cy = size / 2 + 10;
  // Semi-circle arc from 180 to 0 degrees (left to right)
  const angle = Math.min(180, Math.max(0, (score / 100) * 180));
  const rad = ((180 - angle) * Math.PI) / 180;
  const needleX = cx + (radius - 18) * Math.cos(rad);
  const needleY = cy - (radius - 18) * Math.sin(rad);

  const getScoreColor = (s: number) => {
    if (s >= 75) return '#e11d48'; // Critical rose
    if (s >= 50) return '#f97316'; // High orange
    if (s >= 20) return '#f59e0b'; // Medium amber
    return '#10b981'; // Low emerald
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`} className="overflow-visible">
        {/* Arc Background Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Arc Colored Zones */}
        {/* Low (0-20% = 0-36 deg) */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx - radius * Math.cos((36 * Math.PI) / 180)} ${cy - radius * Math.sin((36 * Math.PI) / 180)}`}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Medium (20-50% = 36-90 deg) */}
        <path
          d={`M ${cx - radius * Math.cos((36 * Math.PI) / 180)} ${cy - radius * Math.sin((36 * Math.PI) / 180)} A ${radius} ${radius} 0 0 1 ${cx} ${cy - radius}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          opacity="0.9"
        />
        {/* High (50-75% = 90-135 deg) */}
        <path
          d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 0 1 ${cx + radius * Math.sin((45 * Math.PI) / 180)} ${cy - radius * Math.cos((45 * Math.PI) / 180)}`}
          fill="none"
          stroke="#f97316"
          strokeWidth={strokeWidth}
          opacity="0.9"
        />
        {/* Critical (75-100% = 135-180 deg) */}
        <path
          d={`M ${cx + radius * Math.sin((45 * Math.PI) / 180)} ${cy - radius * Math.cos((45 * Math.PI) / 180)} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#e11d48"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Center Pivot */}
        <circle cx={cx} cy={cy} r="5" fill="#0f172a" />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={needleX} cy={needleY} r="3" fill={getScoreColor(score)} />
      </svg>

      <div className="text-center -mt-2">
        <span className="font-mono text-2xl font-bold tracking-tight" style={{ color: getScoreColor(score) }}>
          {score}
        </span>
        <span className="text-xs text-slate-400 font-mono"> / 100</span>
      </div>
    </div>
  );
}

export function CostFrontierCurve({
  amount = 500,
  chargebackFee = 25,
  falsePositiveChurn = 45,
  stepUpCost = 1.5,
  height = 180,
}: {
  amount?: number;
  chargebackFee?: number;
  falsePositiveChurn?: number;
  stepUpCost?: number;
  height?: number;
}) {
  const width = 340;
  const padding = 30;
  const graphW = width - padding * 2;
  const graphH = height - 30;

  const steps = 20;
  const maxLoss = Math.max(amount + chargebackFee, 100);

  const allowPoints: string[] = [];
  const blockPoints: string[] = [];
  const stepUpPoints: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const x = padding + p * graphW;

    // E[ALLOW] = p * (amount + chargebackFee)
    const costAllow = p * (amount + chargebackFee);
    const yAllow = graphH - (costAllow / maxLoss) * (graphH - 25) + 10;
    allowPoints.push(`${x},${yAllow}`);

    // E[BLOCK] = p * 5 + (1 - p) * (falsePositiveChurn + 0.05 * amount)
    const costBlock = p * 5 + (1 - p) * (falsePositiveChurn + 0.05 * amount);
    const yBlock = graphH - (costBlock / maxLoss) * (graphH - 25) + 10;
    blockPoints.push(`${x},${yBlock}`);

    // E[STEP-UP] = stepUpCost + p * 0.12 * (amount + chargebackFee) + (1 - p) * 8
    const costStepUp = stepUpCost + p * 0.12 * (amount + chargebackFee) + (1 - p) * 8;
    const yStepUp = graphH - (costStepUp / maxLoss) * (graphH - 25) + 10;
    stepUpPoints.push(`${x},${yStepUp}`);
  }

  return (
    <div className="w-full flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        {/* Axes */}
        <line x1={padding} y1={graphH + 10} x2={width - padding} y2={graphH + 10} stroke="#94a3b8" strokeWidth="1" />
        <line x1={padding} y1="10" x2={padding} y2={graphH + 10} stroke="#94a3b8" strokeWidth="1" />

        {/* E[ALLOW] Line (Green) */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          points={allowPoints.join(' ')}
        />

        {/* E[STEP-UP] Line (Amber) */}
        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          points={stepUpPoints.join(' ')}
        />

        {/* E[BLOCK] Line (Rose) */}
        <polyline
          fill="none"
          stroke="#e11d48"
          strokeWidth="2.5"
          points={blockPoints.join(' ')}
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between w-full max-w-[340px] text-[10px] text-slate-500 font-mono mt-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
          <span>E[ALLOW]</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />
          <span>E[STEP-UP]</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" />
          <span>E[BLOCK]</span>
        </div>
      </div>
      <div className="flex justify-between w-full max-w-[340px] text-[10px] text-slate-400 font-mono mt-1">
        <span>p = 0.0 (Legit)</span>
        <span>Fraud Probability (p) &rarr;</span>
        <span>p = 1.0 (Fraud)</span>
      </div>
    </div>
  );
}

export { ModelComparisonRocOverlay } from './ModelComparisonRocOverlay.js';
