/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Compass } from 'lucide-react';
import { Navbar, TabId } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { PlaygroundView } from './components/PlaygroundView.js';
import { ExplorerView } from './components/ExplorerView.js';
import { InvestigationView } from './components/InvestigationView.js';
import { PolicyStudioView } from './components/PolicyStudioView.js';
import { ModelMonitoringView } from './components/ModelMonitoringView.js';
import { ArchitectureExplorerView } from './components/ArchitectureExplorerView.js';
import { ReportsView } from './components/ReportsView.js';
import { CsvUploadModal } from './components/CsvUploadModal.js';
import { TransactionDetailModal } from './components/TransactionDetailModal.js';
import { ExecutiveReportModal } from './components/ExecutiveReportModal.js';
import { ActiveOpeningScene } from './components/ActiveOpeningScene.js';
import { FloatingChatbot } from './components/FloatingChatbot.js';
import { CyberBackgroundCanvas } from './components/CyberBackgroundCanvas.js';
import { spatialAudio } from './utils/spatialAudio.js';
import {
  SystemMetricsOverview,
  TransactionRecord,
  InvestigationStatus,
} from './types/fraud.js';

// The 9 independent pages in the digital book experience
const PAGES: TabId[] = [
  'intro',
  'dashboard',
  'playground',
  'explorer',
  'investigation',
  'policy',
  'monitoring',
  'architecture',
  'reports',
];

const PAGE_META: Record<TabId, { title: string; category: string }> = {
  intro: { title: '3D Planetary Orbit', category: 'EXPERIENCE' },
  dashboard: { title: 'Command Center', category: 'METRICS & ANOMALIES' },
  playground: { title: 'Simulation Playground', category: 'TEST INFERENCE' },
  explorer: { title: 'Live Transactions', category: 'REAL-TIME FEED' },
  investigation: { title: 'Fraud Investigations', category: 'CASE TRIAGE' },
  policy: { title: 'Cost Policy Studio', category: 'ARBITRAGE ENGINE' },
  monitoring: { title: 'Models & Drift', category: 'LIGHTGBM vs XGBOOST' },
  architecture: { title: 'Pipeline Blueprint', category: 'CYBER ARCHITECTURE' },
  reports: { title: 'Audit Reports', category: 'PCI-DSS GOVERNANCE' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('intro');
  const [direction, setDirection] = useState<number>(1);
  const [metrics, setMetrics] = useState<SystemMetricsOverview | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [totalTransactionsCount, setTotalTransactionsCount] = useState<number>(0);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Scroll gesture & debounce transition controls
  const isTransitioningRef = useRef<boolean>(false);
  const wheelDeltaAccumulatorRef = useRef<number>(0);
  const wheelResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  // Global persistent audio preference
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('payshield_audio');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Continuous ambient galaxy soundtrack (audible, warm, persisted)
  useEffect(() => {
    spatialAudio.setMuted(!audioEnabled);
    spatialAudio.startCosmicDrone();
    localStorage.setItem('payshield_audio', String(audioEnabled));

    const handleFirstGesture = () => {
      spatialAudio.startCosmicDrone();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [audioEnabled]);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    spatialAudio.setMuted(!next);
    if (next) {
      spatialAudio.startCosmicDrone();
      spatialAudio.playCelestialChime(2);
    }
  };

  const fetchSystemData = async () => {
    try {
      const [metricsRes, txRes] = await Promise.all([
        fetch('/api/metrics/overview'),
        fetch('/api/transactions?limit=250'),
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }

      if (txRes.ok) {
        const t = await txRes.json();
        setTransactions(t.transactions || []);
        setTotalTransactionsCount(t.total || 0);
      }
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  // Smooth cinematic digital page transition
  const navigateToPage = useCallback(
    (targetTab: TabId) => {
      if (targetTab === activeTab) return;
      const currentIdx = PAGES.indexOf(activeTab);
      const targetIdx = PAGES.indexOf(targetTab);
      const dir = targetIdx > currentIdx ? 1 : -1;
      setDirection(dir);
      setActiveTab(targetTab);
      spatialAudio.playCelestialChime(targetIdx);

      // Modulate scene intensity based on page type
      if (targetTab === 'intro') {
        spatialAudio.setSceneIntensity(0.7);
      } else if (targetTab === 'dashboard' || targetTab === 'monitoring') {
        spatialAudio.setSceneIntensity(0.85);
      } else {
        spatialAudio.setSceneIntensity(0.5);
      }
    },
    [activeTab]
  );

  const goToNextPage = useCallback(() => {
    const currentIdx = PAGES.indexOf(activeTab);
    if (currentIdx < PAGES.length - 1) {
      navigateToPage(PAGES[currentIdx + 1]);
    }
  }, [activeTab, navigateToPage]);

  const goToPrevPage = useCallback(() => {
    const currentIdx = PAGES.indexOf(activeTab);
    if (currentIdx > 0) {
      navigateToPage(PAGES[currentIdx - 1]);
    }
  }, [activeTab, navigateToPage]);

  // Deliberate wheel scroll detection with delta accumulation and transition cooldown
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      // If modal is open, let user interact with modal freely
      if (isUploadOpen || isReportOpen || selectedTransaction !== null) return;

      // If already transitioning between pages, ignore wheel events to prevent double-skipping
      if (isTransitioningRef.current) return;

      const container = pageContainerRef.current;
      let canScrollDown = false;
      let canScrollUp = false;

      if (activeTab === 'intro') {
        // 3D Experience page: Any deliberate downward wheel transitions to Command Center
        canScrollDown = true;
        canScrollUp = false;
      } else if (container) {
        const atTop = container.scrollTop <= 8;
        const atBottom =
          container.scrollTop + container.clientHeight >= container.scrollHeight - 12;
        const fitsScreen = container.scrollHeight <= container.clientHeight + 10;

        canScrollDown = atBottom || fitsScreen;
        canScrollUp = atTop || fitsScreen;
      }

      // Reset accumulator after pause
      if (wheelResetTimeoutRef.current) {
        clearTimeout(wheelResetTimeoutRef.current);
      }
      wheelResetTimeoutRef.current = setTimeout(() => {
        wheelDeltaAccumulatorRef.current = 0;
      }, 350);

      // Accumulate vertical delta (ignores tiny wheel jitter)
      wheelDeltaAccumulatorRef.current += e.deltaY;

      // Downward page turn threshold: 75px
      if (wheelDeltaAccumulatorRef.current > 75 && canScrollDown) {
        const currentIdx = PAGES.indexOf(activeTab);
        if (currentIdx < PAGES.length - 1) {
          isTransitioningRef.current = true;
          wheelDeltaAccumulatorRef.current = 0;
          goToNextPage();
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 800);
        }
      }
      // Upward page turn threshold: -75px
      else if (wheelDeltaAccumulatorRef.current < -75 && canScrollUp) {
        const currentIdx = PAGES.indexOf(activeTab);
        if (currentIdx > 0) {
          isTransitioningRef.current = true;
          wheelDeltaAccumulatorRef.current = 0;
          goToPrevPage();
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 800);
        }
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      if (wheelResetTimeoutRef.current) clearTimeout(wheelResetTimeoutRef.current);
    };
  }, [activeTab, goToNextPage, goToPrevPage, isUploadOpen, isReportOpen, selectedTransaction]);

  // Keyboard navigation: Arrow keys & PageUp/PageDown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUploadOpen || isReportOpen || selectedTransaction !== null) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const container = pageContainerRef.current;
      let canScrollDown = false;
      let canScrollUp = false;

      if (activeTab === 'intro') {
        canScrollDown = true;
        canScrollUp = false;
      } else if (container) {
        const atTop = container.scrollTop <= 8;
        const atBottom =
          container.scrollTop + container.clientHeight >= container.scrollHeight - 12;
        const fitsScreen = container.scrollHeight <= container.clientHeight + 10;
        canScrollDown = atBottom || fitsScreen;
        canScrollUp = atTop || fitsScreen;
      }

      if ((e.key === 'PageDown' || (e.key === 'ArrowDown' && canScrollDown)) && !isTransitioningRef.current) {
        const currentIdx = PAGES.indexOf(activeTab);
        if (currentIdx < PAGES.length - 1) {
          e.preventDefault();
          isTransitioningRef.current = true;
          goToNextPage();
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 800);
        }
      } else if ((e.key === 'PageUp' || (e.key === 'ArrowUp' && canScrollUp)) && !isTransitioningRef.current) {
        const currentIdx = PAGES.indexOf(activeTab);
        if (currentIdx > 0) {
          e.preventDefault();
          isTransitioningRef.current = true;
          goToPrevPage();
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 800);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, goToNextPage, goToPrevPage, isUploadOpen, isReportOpen, selectedTransaction]);

  // Touch swipe support for mobile/tablet digital book page turns
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isUploadOpen || isReportOpen || selectedTransaction !== null) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || isTransitioningRef.current) return;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;
    touchStartYRef.current = null;

    const container = pageContainerRef.current;
    let canScrollDown = false;
    let canScrollUp = false;

    if (activeTab === 'intro') {
      canScrollDown = true;
      canScrollUp = false;
    } else if (container) {
      const atTop = container.scrollTop <= 8;
      const atBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 12;
      const fitsScreen = container.scrollHeight <= container.clientHeight + 10;
      canScrollDown = atBottom || fitsScreen;
      canScrollUp = atTop || fitsScreen;
    }

    if (diffY > 60 && canScrollDown) {
      isTransitioningRef.current = true;
      goToNextPage();
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 800);
    } else if (diffY < -60 && canScrollUp) {
      isTransitioningRef.current = true;
      goToPrevPage();
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 800);
    }
  };

  const handleUpdateInvestigation = async (
    id: string,
    status: InvestigationStatus,
    note?: string,
    evidenceTag?: string
  ) => {
    try {
      const res = await fetch(`/api/transactions/${id}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          note,
          evidenceTag,
          analyst: 'Security Analyst',
        }),
      });

      if (res.ok) {
        const updatedTx: TransactionRecord = await res.json();
        if (selectedTransaction?.id === id) {
          setSelectedTransaction(updatedTx);
        }
        await fetchSystemData();
      }
    } catch (err) {
      console.error('Failed to update investigation:', err);
    }
  };

  // Cinematic page turn motion variants (vertical slide + scale + fade)
  const pageVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 45 : -45,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.42,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -45 : 45,
      opacity: 0,
      scale: 0.985,
      transition: {
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  };

  const currentIdx = PAGES.indexOf(activeTab);

  return (
    <div
      className="relative h-screen w-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Continuous 3D Animated Cyber Environment Persistent Across All Pages */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <CyberBackgroundCanvas reducedMotion={reducedMotion} />
      </div>

      {/* Top Navigation Bar with Direct Page Navigation Links and Global Sound Toggle */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateToPage}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewTransaction={() => navigateToPage('playground')}
        onOpenReportModal={() => setIsReportOpen(true)}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((prev) => !prev)}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
      />

      {/* Main Full-Viewport Digital Book Page Container (Only Active Page is Rendered) */}
      <main className="relative z-10 flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            ref={pageContainerRef}
            className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
          >
            {/* Page 1: 3D Planetary Orbit Experience */}
            {activeTab === 'intro' && (
              <div className="w-full h-full min-h-[calc(100vh-64px)]">
                <ActiveOpeningScene
                  onEnterDashboard={(targetTab) => navigateToPage(targetTab || 'dashboard')}
                  onOpenReportModal={() => setIsReportOpen(true)}
                  reducedMotion={reducedMotion}
                  audioEnabled={audioEnabled}
                  onToggleAudio={handleToggleAudio}
                />
              </div>
            )}

            {/* Page 2: Command Center (Anomaly Heatmaps & Predictive Trends) */}
            {activeTab === 'dashboard' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <DashboardView
                    metrics={metrics}
                    recentTransactions={transactions}
                    onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                    onNavigate={(tab) => navigateToPage(tab)}
                    onOpenReportModal={() => setIsReportOpen(true)}
                  />
                </div>
              </div>
            )}

            {/* Page 3: Interactive Simulation Playground */}
            {activeTab === 'playground' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <PlaygroundView
                    onTransactionEvaluated={() => {
                      fetchSystemData();
                    }}
                  />
                </div>
              </div>
            )}

            {/* Page 4: Live Transaction Explorer */}
            {activeTab === 'explorer' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <ExplorerView
                    transactions={transactions}
                    totalCount={totalTransactionsCount}
                    onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                    onRefresh={fetchSystemData}
                  />
                </div>
              </div>
            )}

            {/* Page 5: Fraud Analyst Investigation & Triage Workspace */}
            {activeTab === 'investigation' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <InvestigationView
                    transactions={transactions}
                    onUpdateInvestigation={handleUpdateInvestigation}
                    onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                  />
                </div>
              </div>
            )}

            {/* Page 6: Cost-Aware Policy Studio */}
            {activeTab === 'policy' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <PolicyStudioView
                    onPolicyUpdated={() => {
                      fetchSystemData();
                    }}
                  />
                </div>
              </div>
            )}

            {/* Page 7: Dual-Model Monitoring & ROC-AUC Comparison */}
            {activeTab === 'monitoring' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <ModelMonitoringView />
                </div>
              </div>
            )}

            {/* Page 8: Real-Time Architecture Pipeline Blueprint */}
            {activeTab === 'architecture' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <ArchitectureExplorerView />
                </div>
              </div>
            )}

            {/* Page 9: Executive Compliance & Loss Avoidance Reports */}
            {activeTab === 'reports' && (
              <div className="min-h-full py-8 px-6 bg-[#030712]/75 backdrop-blur-xs flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1">
                  <ReportsView metrics={metrics} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Cinematic Digital Book Page Dock (Right side pagination & quick controls) */}
      <aside className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center gap-2 p-2 rounded-2xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-md shadow-2xl">
        <button
          onClick={goToPrevPage}
          disabled={currentIdx === 0}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            currentIdx === 0
              ? 'opacity-25 cursor-not-allowed text-slate-600'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Previous Page (Up Arrow or Scroll Up)"
          aria-label="Previous Page"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <div className="text-[10px] font-mono font-bold text-rose-400">
          0{currentIdx + 1}
        </div>

        <div className="flex flex-col items-center gap-1.5 my-1">
          {PAGES.map((pageId, idx) => {
            const isCurrent = activeTab === pageId;
            return (
              <button
                key={pageId}
                onClick={() => navigateToPage(pageId)}
                className="group relative flex items-center justify-center p-1 cursor-pointer"
                title={`${idx + 1}. ${PAGE_META[pageId].title}`}
                aria-label={`Jump to ${PAGE_META[pageId].title}`}
              >
                <div
                  className={`rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-2 h-5 bg-rose-500 shadow-md shadow-rose-500/80'
                      : 'w-2 h-2 bg-slate-700 group-hover:bg-slate-400'
                  }`}
                />
                {/* Floating tooltip */}
                <span className="absolute right-7 px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                  {PAGE_META[pageId].title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[9px] font-mono text-slate-600">
          0{PAGES.length}
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentIdx === PAGES.length - 1}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            currentIdx === PAGES.length - 1
              ? 'opacity-25 cursor-not-allowed text-slate-600'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Next Page (Down Arrow or Scroll Down)"
          aria-label="Next Page"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </aside>

      {/* Modals & AI Chatbot */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onUpdateInvestigation={handleUpdateInvestigation}
      />

      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchSystemData();
        }}
      />

      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        metrics={metrics}
      />

      <FloatingChatbot
        contextTx={selectedTransaction}
        onSelectTransaction={(tx) => setSelectedTransaction(tx)}
      />
    </div>
  );
}
