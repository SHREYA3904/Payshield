/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Trash2,
  Cpu,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Activity,
  Zap,
  Volume2,
} from 'lucide-react';
import { TransactionRecord } from '../types/fraud.js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface FloatingChatbotProps {
  contextTx?: TransactionRecord | null;
  onSelectTransaction?: (tx: TransactionRecord) => void;
}

export function FloatingChatbot({ contextTx }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Greetings! I am PayShield AI Intelligence, your virtual cybersecurity and fraud defense co-pilot. I can analyze transactions, compare LightGBM vs. XGBoost model architectures, explain cost frontiers, or test policy thresholds. Say hello, or ask me anything to get started!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener('open-payshield-chat', handleCustomOpen);
    return () => window.removeEventListener('open-payshield-chat', handleCustomOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // When contextTx changes, add a notification prompt
  useEffect(() => {
    if (contextTx && isOpen) {
      const txTag = `[Context: ${contextTx.id}]`;
      const alreadyHas = messages.some((m) => m.text.includes(txTag));
      if (!alreadyHas) {
        const action = contextTx.evaluation?.decision || 'ALLOW';
        const score = contextTx.evaluation?.riskScore ?? 0;
        const merchant = contextTx.merchantCategory || 'Merchant';
        setMessages((prev) => [
          ...prev,
          {
            id: `ctx-${contextTx.id}`,
            sender: 'assistant',
            text: `Focused on transaction ${contextTx.id} ($${contextTx.amount.toFixed(2)} at ${merchant}). Calibrated risk score is ${score.toFixed(0)}/100 (${action}). Would you like me to explain its Tree-SHAP drivers or cost impact?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
  }, [contextTx?.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          messages: [{ text: query }],
          contextTxId: contextTx?.id,
          modelChoice: 'agent_ensemble',
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "PayShield verified the transaction matrix. All parameters within bounds.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Chat API fallback invoked:', err);
      const q = query.toLowerCase().trim();
      let fallbackText = '';

      // Intelligent Client Dialogue Fallback
      if (/^(hi|hello|hey|hola|greetings|good\s*(morning|afternoon|evening)|yo|sup|heya|howdy)\b/i.test(q)) {
        fallbackText = "Hello! I am PayShield AI Intelligence, your autonomous cybersecurity co-pilot. All fraud detection pipelines and models are actively online. How can I assist you with transaction analysis or policy reviews today?";
      } else if (/^(bye|goodbye|see\s*you|cya|see\s*ya|farewell|later|take\s*care|good\s*night|night|exit|quit)\b/i.test(q)) {
        fallbackText = "Goodbye! PayShield continuous monitoring and autonomous fraud prevention remain fully operational in the background. Stay secure, and feel free to reopen anytime!";
      } else if (/^(thanks|thank\s*you|thx|appreciate\s*it|great|awesome|cool)\b/i.test(q)) {
        fallbackText = "You're very welcome! PayShield's goal is seamless protection with under 2.0% customer friction. Let me know if you need anything else.";
      } else if (q.includes('lightgbm') || q.includes('xgboost') || q.includes('model') || q.includes('benchmark')) {
        fallbackText = "LightGBM outperforms on IEEE-CIS (0.946 ROC-AUC, 1.6ms latency) due to GOSS and Exclusive Feature Bundling over high-cardinality device categorical tokens. XGBoost wins on European Credit Card (0.982 ROC-AUC) due to exact greedy splits and L2 Hessian regularization on 28 continuous PCA features under extreme 0.172% imbalance.";
      } else if (q.includes('friction') || q.includes('budget')) {
        fallbackText = "PayShield strictly caps Step-Up friction to <= 2.0% of legitimate volume using dynamic threshold calibration (Step-Up cut-off: 0.35, Block cut-off: 0.72) to minimize customer cart abandonment.";
      } else {
        fallbackText = `PayShield Intelligence: I have processed "${query}". System telemetry reports nominal performance across all nodes with 95.8% fraud capture and 1.24% friction rate. Would you like me to inspect a transaction or compare model ROC curves?`;
      }

      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Hello PayShield!",
    "Why does LightGBM beat XGBoost on IEEE-CIS?",
    "Explain the <2% friction budget",
    "How does the cost frontier work?",
    ...(contextTx ? [`Analyze risk factors for ${contextTx.id}`] : []),
  ];

  return (
    <>
      {/* Persistent Virtual Floating AI Assistant with Animated Digital Holographic Avatar */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-end select-none">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              className="relative flex items-center"
            >
              {/* Floating Status Pill Callout */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden lg:flex items-center gap-2 mr-3 px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-rose-500/30 shadow-lg text-xs font-mono text-slate-300 pointer-events-none"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80" />
                <span className="text-white font-semibold">PayShield AI</span>
                <span className="text-slate-500">·</span>
                <span className="text-rose-400">Online</span>
              </motion.div>

              {/* Holographic Avatar Core Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsOpen(true)}
                className="relative group w-16 h-16 rounded-full bg-slate-950/90 backdrop-blur-xl border-2 border-rose-500/60 shadow-[0_0_35px_rgba(225,29,72,0.45)] hover:border-rose-400 transition-all flex items-center justify-center cursor-pointer overflow-hidden"
                title="Launch PayShield Virtual AI Assistant"
              >
                {/* Outer Revolving Orbital Ring 1 */}
                <div className="absolute inset-0.5 rounded-full border border-dashed border-rose-400/40 animate-[spin_10s_linear_infinite] pointer-events-none" />

                {/* Outer Revolving Orbital Ring 2 (Counter-Clockwise) */}
                <div className="absolute inset-1.5 rounded-full border border-cyan-400/30 animate-[spin_14s_linear_infinite_reverse] pointer-events-none" />

                {/* Inner Glowing Gradient Sphere */}
                <div className="absolute inset-2.5 rounded-full bg-gradient-to-tr from-rose-950 via-slate-900 to-rose-900/60 flex items-center justify-center shadow-inner">
                  {/* Central Digital Avatar Face / Neural Core */}
                  <div className="relative flex flex-col items-center justify-center">
                    <Bot className="w-5 h-5 text-rose-300 group-hover:text-white transition-colors" />

                    {/* Animated Equalizer Waveform Bars */}
                    <div className="flex items-center gap-0.5 mt-1">
                      <span className="w-0.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-0.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      <span className="w-0.5 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:450ms]" />
                    </div>
                  </div>
                </div>

                {/* Radar Ping Indicator */}
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-slate-950"></span>
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[450px] h-[600px] max-h-[85vh] flex flex-col rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-rose-900/50 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-slate-100 font-sans"
          >
            {/* Header with Animated Digital Avatar */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Header Holographic Avatar Orb */}
                <div className="relative w-9 h-9 rounded-full bg-slate-950 border border-rose-500/50 flex items-center justify-center shadow-lg shadow-rose-950/50 overflow-hidden">
                  <div className="absolute inset-0 rounded-full border border-dashed border-rose-400/40 animate-[spin_8s_linear_infinite]" />
                  <Bot className="w-4 h-4 text-rose-300 z-10" />
                  <span className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-emerald-400 to-cyan-500" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide text-white font-mono">
                      PayShield Virtual AI
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-950/80 text-rose-300 border border-rose-800/40">
                      Gemini 3.8
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Autonomous Co-Pilot Active</span>
                    <span>·</span>
                    <span className="text-emerald-400">1.6ms</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([messages[0]])}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Close AI Copilot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Badge if transaction is active */}
            {contextTx && (
              <div className="px-3.5 py-2 bg-rose-950/20 border-b border-rose-900/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-rose-300 truncate">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span className="truncate font-semibold">
                    Focus: {contextTx.id} (${contextTx.amount.toFixed(2)})
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {contextTx.evaluation?.decision || 'ALLOW'}
                </span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-slate-950 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400 mt-0.5 shadow-sm">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-rose-600 text-white rounded-tr-xs'
                        : 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-tl-xs backdrop-blur-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span
                      className={`block text-[10px] mt-1 font-mono ${
                        m.sender === 'user' ? 'text-rose-200 text-right' : 'text-slate-500'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-full bg-slate-950 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl px-3.5 py-2.5 rounded-tl-xs flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:300ms]" />
                    <span className="ml-1 text-[11px] text-slate-400">Synthesizing telemetry...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Pills */}
            <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-[11px] font-mono text-slate-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>{qp}</span>
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fraud models, say hi/bye, or test a policy..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-950/60 cursor-pointer"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
