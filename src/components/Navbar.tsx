/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Upload,
  PlusCircle,
  ShieldCheck,
  Zap,
  Activity,
  Download,
  Sparkles,
  FileText,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'framer-motion';

export type TabId =
  | 'intro'
  | 'dashboard'
  | 'playground'
  | 'explorer'
  | 'investigation'
  | 'policy'
  | 'monitoring'
  | 'architecture'
  | 'reports';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onOpenUpload: () => void;
  onOpenNewTransaction: () => void;
  onOpenReportModal?: () => void;
  reducedMotion?: boolean;
  onToggleReducedMotion?: () => void;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenNewTransaction,
  onOpenReportModal,
  reducedMotion = false,
  onToggleReducedMotion,
  audioEnabled = true,
  onToggleAudio,
}: NavbarProps) {
  const navItems: Array<{ id: TabId; label: string }> = [
    { id: 'intro', label: '3D Experience' },
    { id: 'dashboard', label: 'Command Center' },
    { id: 'playground', label: 'Playground' },
    { id: 'explorer', label: 'Transactions' },
    { id: 'investigation', label: 'Investigations' },
    { id: 'policy', label: 'Cost Policy' },
    { id: 'monitoring', label: 'Models & Drift' },
    { id: 'architecture', label: 'Pipeline Blueprint' },
    { id: 'reports', label: 'Audit Reports' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
        {/* Zone 1: Single text element wordmark */}
        <div
          onClick={() => setActiveTab('intro')}
          className="flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-rose-900 flex items-center justify-center text-white shadow-lg shadow-rose-950/50 border border-rose-500/40 group-hover:border-rose-400 transition-colors">
            <ShieldCheck className="w-5 h-5 text-rose-100" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white font-mono">
                Pay<span className="text-rose-500">Shield</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 hidden sm:inline-block">
                AI DEFENSE
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider hidden md:block">
              LightGBM · XGBoost · Active Theory 3D
            </span>
          </div>
        </div>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden xl:flex items-center gap-1 text-xs font-mono font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 bg-rose-950/60 border border-rose-600/50 rounded-lg -z-10 shadow-sm shadow-rose-950/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleReducedMotion && (
            <button
              onClick={onToggleReducedMotion}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors border cursor-pointer ${
                reducedMotion
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-rose-950/60 border-rose-800/50 text-rose-300 hover:bg-rose-900/60 shadow-xs'
              }`}
              title={reducedMotion ? 'Enable Full 3D Fluid Motion' : 'Switch to Reduced 3D Motion'}
            >
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>{reducedMotion ? '3D: Reduced' : '3D: Active'}</span>
            </button>
          )}

          {/* Persistent Soundscape Toggle */}
          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors border cursor-pointer ${
                audioEnabled
                  ? 'bg-rose-950/60 border-rose-800/50 text-rose-300 hover:bg-rose-900/60 shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={audioEnabled ? 'Mute Galaxy Soundscape' : 'Enable Galaxy Soundscape'}
            >
              {audioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden md:inline">{audioEnabled ? 'Sound: On' : 'Sound: Off'}</span>
            </button>
          )}

          {/* Download Report Button */}
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              title="Download Executive Fraud & Audit Report"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Report</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-md shadow-rose-950/50 border border-rose-500/50 whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Test Pipeline</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="xl:hidden flex items-center overflow-x-auto gap-2 px-4 py-2 border-t border-slate-800/60 bg-slate-950 scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1 text-xs font-mono rounded-md cursor-pointer transition-colors ${
              activeTab === item.id
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
