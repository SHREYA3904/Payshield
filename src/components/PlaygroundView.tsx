/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TransactionInput,
  TransactionRecord,
  PaymentMethod,
  ModelEngine,
} from '../types/fraud.js';
import { ShapWaterfallBar, RiskGauge } from './Charts.js';
import {
  Play,
  RotateCcw,
  Sparkles,
  Columns,
  CheckCircle2,
  AlertOctagon,
  ShieldQuestion,
  HelpCircle,
  FileCheck,
  Cpu,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';

const PRESETS: Array<{ name: string; desc: string; data: TransactionInput }> = [
  {
    name: 'Normal Domestic Purchase',
    desc: 'Regular retail purchase by seasoned customer from habitual home location',
    data: {
      amount: 48.5,
      customerId: 'CUST-1042',
      paymentMethod: 'credit_card',
      merchantCategory: 'Supermarket',
      customerCountry: 'US',
      merchantCountry: 'US',
      ipDistanceKm: 15,
      deviceType: 'mobile',
      isVpnOrProxy: false,
      velocity1h: 1,
      velocity24h: 2,
      avgPastAmount: 52,
      failedAttempts24h: 0,
      accountAgeDays: 480,
    },
  },
  {
    name: 'Automated Bot Carding Attack',
    desc: 'Rapid carding testing using emulated browser and VPN network',
    data: {
      amount: 420.0,
      customerId: 'CUST-8819',
      paymentMethod: 'credit_card',
      merchantCategory: 'Digital Services',
      customerCountry: 'US',
      merchantCountry: 'GB',
      ipDistanceKm: 5800,
      deviceType: 'bot_emulated',
      isVpnOrProxy: true,
      velocity1h: 6,
      velocity24h: 19,
      avgPastAmount: 30,
      failedAttempts24h: 3,
      accountAgeDays: 1,
    },
  },
  {
    name: 'Large Cross-Border Wire',
    desc: 'Irreversible high-value wire request with location disparity',
    data: {
      amount: 9200.0,
      customerId: 'CUST-3310',
      paymentMethod: 'wire_transfer',
      merchantCategory: 'Crypto Exchange',
      customerCountry: 'US',
      merchantCountry: 'RU',
      ipDistanceKm: 7600,
      deviceType: 'desktop',
      isVpnOrProxy: true,
      velocity1h: 2,
      velocity24h: 3,
      avgPastAmount: 350,
      failedAttempts24h: 2,
      accountAgeDays: 320,
    },
  },
  {
    name: 'Borderline Travel Spike',
    desc: 'Customer booking expensive flight abroad with minor geo-distance',
    data: {
      amount: 890.0,
      customerId: 'CUST-5521',
      paymentMethod: 'credit_card',
      merchantCategory: 'Travel & Airline',
      customerCountry: 'US',
      merchantCountry: 'FR',
      ipDistanceKm: 6200,
      deviceType: 'mobile',
      isVpnOrProxy: false,
      velocity1h: 1,
      velocity24h: 2,
      avgPastAmount: 220,
      failedAttempts24h: 0,
      accountAgeDays: 650,
    },
  },
];

interface PlaygroundViewProps {
  onTransactionEvaluated?: (record: TransactionRecord) => void;
}

export function PlaygroundView({ onTransactionEvaluated }: PlaygroundViewProps) {
  // Scenario A Form State
  const [formDataA, setFormDataA] = useState<TransactionInput>(PRESETS[0].data);
  const [engineA, setEngineA] = useState<ModelEngine>('agent_ensemble');
  const [resultA, setResultA] = useState<TransactionRecord | null>(null);
  const [evaluatingA, setEvaluatingA] = useState(false);

  // Scenario B Form State (for side-by-side comparison)
  const [compareMode, setCompareMode] = useState(false);
  const [formDataB, setFormDataB] = useState<TransactionInput>(PRESETS[1].data);
  const [engineB, setEngineB] = useState<ModelEngine>('agent_ensemble');
  const [resultB, setResultB] = useState<TransactionRecord | null>(null);
  const [evaluatingB, setEvaluatingB] = useState(false);

  // Pipeline step tracker
  const [activeStep, setActiveStep] = useState<number>(0);

  const runEvaluation = async (
    data: TransactionInput,
    isScenarioB = false,
    selectedEngineChoice?: ModelEngine
  ) => {
    const chosenEngine = selectedEngineChoice || (isScenarioB ? engineB : engineA);

    if (isScenarioB) setEvaluatingB(true);
    else {
      setEvaluatingA(true);
      setActiveStep(1);
    }

    try {
      if (!isScenarioB) {
        setTimeout(() => setActiveStep(2), 150);
        setTimeout(() => setActiveStep(3), 300);
        setTimeout(() => setActiveStep(4), 450);
        setTimeout(() => setActiveStep(5), 600);
        setTimeout(() => setActiveStep(6), 750);
        setTimeout(() => setActiveStep(7), 900);
      }

      const res = await fetch('/api/transactions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          modelChoice: chosenEngine,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const evaluated: TransactionRecord = await res.json();

      if (isScenarioB) {
        setResultB(evaluated);
      } else {
        setResultA(evaluated);
        setActiveStep(8);
        if (onTransactionEvaluated) {
          onTransactionEvaluated(evaluated);
        }
      }
    } catch (err) {
      console.error('Failed to evaluate transaction:', err);
    } finally {
      if (isScenarioB) setEvaluatingB(false);
      else setEvaluatingA(false);
    }
  };

  const renderForm = (
    data: TransactionInput,
    setData: React.Dispatch<React.SetStateAction<TransactionInput>>,
    currentEngine: ModelEngine,
    setEngine: (m: ModelEngine) => void,
    label: string
  ) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-sm font-bold text-white font-mono">{label}</span>
          <span className="text-xs text-slate-400 font-mono">Input Parameters</span>
        </div>

        {/* Model Engine Picker */}
        <div>
          <label className="block text-slate-400 font-mono text-[11px] mb-1.5 uppercase tracking-wider">
            Model Inference Engine
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setEngine('agent_ensemble')}
              className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentEngine === 'agent_ensemble'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Agent Auto
            </button>
            <button
              type="button"
              onClick={() => setEngine('lightgbm')}
              className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentEngine === 'lightgbm'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              LightGBM (1.6ms)
            </button>
            <button
              type="button"
              onClick={() => setEngine('xgboost')}
              className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentEngine === 'xgboost'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              XGBoost (4.2ms)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-mono mb-1">Amount ($ USD)</label>
            <input
              type="number"
              value={data.amount}
              onChange={(e) => setData({ ...data, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Customer Identifier</label>
            <input
              type="text"
              value={data.customerId}
              onChange={(e) => setData({ ...data, customerId: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Payment Method</label>
            <select
              value={data.paymentMethod}
              onChange={(e) => setData({ ...data, paymentMethod: e.target.value as PaymentMethod })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden focus:border-rose-500"
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="wire_transfer">Wire Transfer</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="p2p">P2P Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Merchant Category</label>
            <input
              type="text"
              value={data.merchantCategory}
              onChange={(e) => setData({ ...data, merchantCategory: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Customer / Merchant Country</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={data.customerCountry}
                onChange={(e) => setData({ ...data, customerCountry: e.target.value.toUpperCase() })}
                placeholder="Cust"
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden"
              />
              <input
                type="text"
                value={data.merchantCountry}
                onChange={(e) => setData({ ...data, merchantCountry: e.target.value.toUpperCase() })}
                placeholder="Merch"
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">IP Distance (km)</label>
            <input
              type="number"
              value={data.ipDistanceKm}
              onChange={(e) => setData({ ...data, ipDistanceKm: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Device Type</label>
            <select
              value={data.deviceType}
              onChange={(e) => setData({ ...data, deviceType: e.target.value as any })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-hidden"
            >
              <option value="mobile">Mobile (Trusted OS)</option>
              <option value="desktop">Desktop Web</option>
              <option value="tablet">Tablet</option>
              <option value="bot_emulated">Bot / Emulated Headless</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">VPN / Proxy Detection</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={data.isVpnOrProxy}
                  onChange={(e) => setData({ ...data, isVpnOrProxy: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-rose-600 focus:ring-0"
                />
                <span>Active VPN / Tor Exit</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">1h / 24h Velocity Count</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={data.velocity1h}
                onChange={(e) => setData({ ...data, velocity1h: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white"
              />
              <input
                type="number"
                value={data.velocity24h}
                onChange={(e) => setData({ ...data, velocity24h: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Failed Attempts (24h)</label>
            <input
              type="number"
              value={data.failedAttempts24h}
              onChange={(e) => setData({ ...data, failedAttempts24h: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Past Avg Amount ($)</label>
            <input
              type="number"
              value={data.avgPastAmount}
              onChange={(e) => setData({ ...data, avgPastAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Account Age (Days)</label>
            <input
              type="number"
              value={data.accountAgeDays}
              onChange={(e) => setData({ ...data, accountAgeDays: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderResultCard = (res: TransactionRecord, label: string) => {
    const ev = res.evaluation || (res as any);
    const action = ev.decision || (res as any).decision?.action || 'ALLOW';
    const isBlock = action === 'BLOCK';
    const isStepUp = action === 'STEP-UP';
    const score = ev.riskScore ?? (res as any).riskScore ?? 0;
    const prob = ev.fraudProbability ?? (res as any).fraudProbability ?? 0;
    const latency = ev.inferenceLatencyMs ?? (res as any).prediction?.inferenceLatencyMs ?? 2.1;
    const expectedCosts = ev.expectedCosts || (res as any).decision?.expectedCosts || {};
    const ruleTriggered = ev.policyRuleTriggered || (res as any).decision?.ruleTriggered || 'Cost Matrix Optimization';
    const shapValues = ev.shapValues || (res as any).prediction?.shapValues || [];
    const baseValue = ev.baseValue ?? (res as any).prediction?.baseValue ?? 0;
    const explanation = ev.aiExplanation || (res as any).aiExplanation || '';
    const comp = (res as any).prediction?.engineComparison;

    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-sm font-bold text-white font-mono">
              {label} Evaluation Result ({res.id})
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Latency: {latency} ms
          </span>
        </div>

        {/* Dual-Engine Routing Telemetry */}
        {comp && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Dual-Engine Arbitration:</span>
              <span className="text-amber-400 font-bold">Recommended: {comp.recommendedModel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">LightGBM Score:</span>
                <span className="text-emerald-400 font-bold">{(comp.lightgbmProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">XGBoost Score:</span>
                <span className="text-amber-400 font-bold">{(comp.xgboostProbability * 100).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Routing Reason: {comp.routingReason}
            </p>
          </div>
        )}

        {/* Primary Decision Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="sm:col-span-7 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              Policy Outcome:
            </span>
            <div
              className={`text-2xl font-black font-mono tracking-tight px-3 py-1.5 rounded-lg inline-block ${
                isBlock
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                  : isStepUp
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
              }`}
            >
              {action}
            </div>
            <div className="text-xs text-slate-300">
              {isBlock
                ? 'Transaction rejected / held to prevent losses'
                : isStepUp
                ? '2FA / Out-of-band Biometric Challenge required'
                : 'Approved under normal clearing limits'}
            </div>
            <div className="pt-2 text-xs text-slate-400 font-mono">
              Fraud Probability: {(prob * 100).toFixed(1)}% · Level: {ev.riskLevel || 'STANDARD'}
            </div>
          </div>

          <div className="sm:col-span-5 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 pt-3 sm:pt-0">
            <RiskGauge score={score} size={150} />
          </div>
        </div>

        {/* Expected Cost Comparison Table */}
        <div>
          <div className="text-xs font-bold text-white font-mono mb-2">
            Expected Cost Comparison (Cost Matrix Evaluation)
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            {(['ALLOW', 'STEP-UP', 'BLOCK'] as const).map((a) => {
              const costObj = expectedCosts[a];
              const isSelected = action === a;
              return (
                <div
                  key={a}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-rose-950/40 text-white shadow-md shadow-rose-950/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className={`text-[11px] font-semibold ${isSelected ? 'text-rose-300' : 'text-slate-400'}`}>
                    {a}
                  </div>
                  <div className="text-base font-bold font-mono my-0.5 text-white">
                    ${costObj?.expectedCost?.toFixed(2) || '0.00'}
                  </div>
                  <div className={`text-[10px] ${isSelected ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                    {isSelected ? 'Minimum Expected Loss' : 'Alternative Action'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Governing Rule */}
        <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 font-mono">
          <span className="font-semibold text-rose-400">Governing Policy Rule: </span>
          {ruleTriggered}
        </div>

        {/* SHAP Waterfall Plot */}
        <div>
          <div className="text-xs font-bold text-white font-mono mb-2">
            SHAP Feature Attributions (Log-Odds Impact)
          </div>
          <ShapWaterfallBar
            shapValues={shapValues}
            baseValue={baseValue}
            finalScore={score}
          />
        </div>

        {/* AI-Generated Explanation */}
        {explanation && (
          <div className="border border-rose-900/40 bg-rose-950/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 font-mono">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>AI Decision Explanation (Gemini 3.8 Flash Grounded)</span>
            </div>
            <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {explanation}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans text-slate-100">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Pay<span className="text-rose-500">Shield</span> Pipeline Playground
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>Modular Evaluation</span>
            <span>·</span>
            <span>Deterministic Policy Engine</span>
            <span>·</span>
            <span>SHAP Explainability</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              compareMode
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{compareMode ? 'Exit Comparison' : 'Side-by-Side Comparison'}</span>
          </button>
        </div>
      </div>

      {/* Preset Archetypes Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-xs font-mono font-semibold text-slate-400 mb-2">
          Load Scenario Archetypes:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFormDataA({ ...preset.data });
                runEvaluation(preset.data);
              }}
              className="text-left p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900 hover:border-slate-700 transition-all text-xs group cursor-pointer"
            >
              <div className="font-bold text-white group-hover:text-rose-400 transition-colors font-mono">
                {preset.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 8-Step Decision Pipeline Stepper (Visual Flow) */}
      {!compareMode && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <span className="text-xs font-bold text-white font-mono">
              8-Step Decision Pipeline Execution
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Deterministic Orchestration
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono">
            {[
              { num: 1, label: 'Validation' },
              { num: 2, label: 'Preprocessing' },
              { num: 3, label: 'Probability' },
              { num: 4, label: 'Risk Score' },
              { num: 5, label: 'Cost Policy' },
              { num: 6, label: 'Final Action' },
              { num: 7, label: 'AI Narrative' },
              { num: 8, label: 'Audit Log' },
            ].map((step) => {
              const isPast = activeStep >= step.num;
              const isCurrent = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`p-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-rose-500 bg-rose-950/60 text-white font-bold'
                      : isPast
                      ? 'border-slate-700 bg-slate-950 text-slate-200'
                      : 'border-slate-800/60 bg-slate-950/40 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5">Step {step.num}</div>
                  <div className="truncate text-xs">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Form & Results Area */}
      <div className={`grid gap-6 ${compareMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Scenario A Container */}
        <div className={`${compareMode ? 'space-y-4' : 'lg:col-span-5 space-y-4'} bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl`}>
          {renderForm(formDataA, setFormDataA, engineA, setEngineA, 'Scenario A')}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setFormDataA(PRESETS[0].data)}
              className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => runEvaluation(formDataA, false, engineA)}
              disabled={evaluatingA}
              className="px-4 py-2 text-xs font-mono font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950/40 border border-rose-500/50 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{evaluatingA ? 'Evaluating...' : 'Run Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Results for Scenario A (or comparison) */}
        {!compareMode && (
          <div className="lg:col-span-7 space-y-4">
            {resultA ? (
              renderResultCard(resultA, 'Scenario A')
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-slate-950/40">
                <FileCheck className="w-10 h-10 text-slate-600 mb-3" />
                <h3 className="text-sm font-bold text-slate-300 font-mono">No Evaluation Submitted</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Adjust parameters on the left or select an archetype preset, then click "Run Pipeline" to inspect the complete 8-step decision process.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Comparison Scenario B */}
        {compareMode && (
          <div className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
            {renderForm(formDataB, setFormDataB, engineB, setEngineB, 'Scenario B')}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setFormDataB(PRESETS[1].data)}
                className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => runEvaluation(formDataB, true, engineB)}
                disabled={evaluatingB}
                className="px-4 py-2 text-xs font-mono font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-950/40 border border-amber-500/50 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{evaluatingB ? 'Evaluating...' : 'Run Pipeline'}</span>
              </button>
            </div>

            {resultB && renderResultCard(resultB, 'Scenario B')}
          </div>
        )}
      </div>
    </div>
  );
}
