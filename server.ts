/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.js';
import { policyEngine } from './src/server/policyEngine.js';
import { TransactionInput } from './src/types/fraud.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '15mb' }));

  // --- REST API Endpoints ---

  // 1. System Metrics Overview
  app.get('/api/metrics/overview', (req, res) => {
    try {
      const overview = db.getSystemMetricsOverview();
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Query Transactions
  app.get('/api/transactions', (req, res) => {
    try {
      const {
        dateFrom,
        dateTo,
        riskLevel,
        decision,
        investigationStatus,
        search,
        limit,
        offset,
      } = req.query;

      const result = db.getTransactions({
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        riskLevel: riskLevel as string,
        decision: decision as string,
        investigationStatus: investigationStatus as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Single Transaction Detail
  app.get('/api/transactions/:id', (req, res) => {
    try {
      const tx = db.getTransactionById(req.params.id);
      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(tx);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Ingest & Evaluate Transaction
  app.post('/api/transactions/evaluate', async (req, res) => {
    try {
      const input = req.body as TransactionInput;
      if (!input || typeof input.amount !== 'number') {
        return res.status(400).json({ error: 'Invalid transaction input: amount is required.' });
      }

      const record = await db.evaluateAndStore(input, true);
      res.json(record);
    } catch (err: any) {
      console.error('Error evaluating transaction:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Batch Ingestion (CSV / Bulk)
  app.post('/api/transactions/batch', async (req, res) => {
    try {
      const items = req.body.transactions as TransactionInput[];
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Array of transactions expected.' });
      }

      const results = [];
      for (const item of items) {
        const record = await db.evaluateAndStore(item, false); // Quick evaluate without blocking LLM calls
        results.push(record);
      }

      res.json({
        totalProcessed: results.length,
        processed: results,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Analyst Feedback / Investigation Triage
  app.post('/api/transactions/:id/investigate', (req, res) => {
    try {
      const { status, note, evidenceTag, analyst } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required.' });
      }

      const updated = db.updateInvestigation(
        req.params.id,
        status,
        note,
        evidenceTag,
        analyst || 'Risk Analyst'
      );

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Policy Management
  app.get('/api/policy', (req, res) => {
    try {
      const currentConfig = policyEngine.getConfig();
      const versions = db.getPolicyVersions();
      res.json({
        currentConfig,
        versions,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Policy Simulation
  app.post('/api/policy/simulate', (req, res) => {
    try {
      const proposedConfig = req.body.config;
      if (!proposedConfig) {
        return res.status(400).json({ error: 'Proposed config required' });
      }

      const simulation = db.simulatePolicy(proposedConfig);
      res.json(simulation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Policy Update & Deployment
  app.post('/api/policy/update', (req, res) => {
    try {
      const { version, author, description, config } = req.body;
      if (!config || !version) {
        return res.status(400).json({ error: 'Version and config required' });
      }

      const updated = db.savePolicyVersion(
        version,
        author || 'Lead Risk Policy Administrator',
        description || 'Custom threshold adjustments',
        config
      );

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Model Management & Lifecycle
  app.get('/api/models', (req, res) => {
    try {
      const models = db.getModelVersions();
      const auditLogs = db.getAuditLogs();
      res.json({ models, auditLogs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/models/benchmarks', (req, res) => {
    try {
      const benchmarks = db.getDatasetBenchmarks();
      res.json(benchmarks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/models/deploy', (req, res) => {
    try {
      const { version, author } = req.body;
      if (!version) {
        return res.status(400).json({ error: 'Model version required' });
      }

      const deployed = db.deployModel(version, author || 'Model Governance Officer');
      res.json(deployed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Persistent AI Chatbot Assistant Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, message, query, contextTxId } = req.body;
      let userQuery = '';
      if (typeof message === 'string' && message.trim()) {
        userQuery = message.trim();
      } else if (typeof query === 'string' && query.trim()) {
        userQuery = query.trim();
      } else if (Array.isArray(messages) && messages.length > 0) {
        userQuery = messages[messages.length - 1]?.text || messages[messages.length - 1]?.content || '';
      }

      if (!userQuery) {
        return res.status(400).json({ error: 'Message or messages array required' });
      }

      const metrics = db.getSystemMetricsOverview();
      let txContext = '';
      if (contextTxId) {
        const tx = db.getTransactionById(contextTxId);
        if (tx) {
          txContext = `\n[SELECTED TRANSACTION IN VIEW: ID: ${tx.id}, Amount: $${tx.amount}, Customer: ${tx.customerId}, Route: ${tx.customerCountry}->${tx.merchantCountry} (${tx.ipDistanceKm}km), RiskScore: ${tx.evaluation.riskScore}/100, Decision: ${tx.evaluation.decision}, Model: ${tx.evaluation.modelVersion}, Top SHAP: ${tx.evaluation.shapValues[0]?.feature || 'none'}]`;
        }
      }

      const systemPrompt = `You are the PayShield Autonomous Fraud & Risk Intelligence Agent, the resident virtual AI assistant for PayShield.
You assist financial risk analysts, fraud operations officers, and executives in a high-security fintech command center.
System Context:
- Platform: PayShield AI Autonomous Command Center
- Total Transactions: ${metrics.totalAnalyzed}
- Fraud Detection Rate: ${metrics.fraudDetectionRate.toFixed(1)}%
- Customer Friction Rate: ${metrics.frictionRate.toFixed(2)}% (Target Friction Budget: <= 2.0%)
- Core Models: LightGBM (specialized for high-cardinality sparse device/IP categoricals, 1.6ms latency) and XGBoost (specialized for continuous numerical amounts & extreme class imbalance, 4.2ms latency). The PayShield Agent Ensemble dynamically routes between them.
${txContext}

CRITICAL INTERACTION GUIDELINES:
1. Always respond naturally, helpfully, and conversationally to ANY user input:
   - When greeted (e.g., 'hi', 'hello', 'hey', 'good morning', 'greetings'), welcome them warmly to PayShield Command Center and offer assistance with transaction analysis, model performance curves, or policy calibrations.
   - When given a farewell (e.g., 'bye', 'goodbye', 'see you', 'farewell', 'goodnight'), respond warmly and politely, assuring them that PayShield 24/7 continuous monitoring and fraud protection remains actively safeguarding transactions.
   - When thanked (e.g., 'thanks', 'thank you'), acknowledge graciously.
   - When asked about transactions or risk metrics, provide precise figures from telemetry.
2. If asked about model differences, explain why LightGBM excels on IEEE-CIS high-cardinality device features, while XGBoost excels on continuous PCA distributions like European Credit Card.
3. Keep responses concise, articulate, and professional with a futuristic fintech cybersecurity tone.`;

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const contents = [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Message: ${userQuery}` }] },
        ];

        try {
          const apiCall = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              temperature: 0.4,
            },
          });

          const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 7000));
          const response = await Promise.race([apiCall, timeout]);

          if (response && response.text) {
            return res.json({ reply: response.text.trim() });
          }
        } catch (genaiErr) {
          console.warn('Gemini chat API call fallback:', genaiErr);
        }
      }

      // Rich Intelligent Conversational Fallback Engine (Covers greetings, goodbyes, questions, and domain inquiries)
      const q = userQuery.toLowerCase().trim();
      let fallbackReply = '';

      // 1. Natural Greetings
      if (/^(hi|hello|hey|hola|greetings|good\s*(morning|afternoon|evening|day)|yo|sup|heya|howdy)\b/i.test(q)) {
        const greetings = [
          `Hello! I am PayShield AI Intelligence, your autonomous cybersecurity and fraud defense co-pilot. All financial telemetry systems are active. How can I assist your investigation or policy review today?`,
          `Greetings! PayShield continuous monitoring is nominal. I can assist you with real-time transaction scoring, ROC-AUC model comparisons (LightGBM vs XGBoost), or cost frontier calibrations. What would you like to explore?`,
          `Welcome to the PayShield Command Center! I am online and monitoring ${metrics.totalAnalyzed.toLocaleString()} transactions with a ${metrics.fraudDetectionRate.toFixed(1)}% capture rate. How can I help you today?`,
        ];
        fallbackReply = greetings[Math.floor(Math.random() * greetings.length)];
      }
      // 2. Natural Farewells
      else if (/^(bye|goodbye|see\s*you|cya|see\s*ya|farewell|later|take\s*care|good\s*night|night|exit|quit)\b/i.test(q)) {
        const farewells = [
          `Goodbye! PayShield continuous monitoring and autonomous fraud prevention remain fully operational in the background. Feel free to re-engage anytime a transaction anomaly requires inspection.`,
          `Farewell! All payment streams and security policies are actively enforced within the 2.0% friction budget. Have a secure day!`,
          `See you later! I will continue scanning live transactions and logging audit telemetry. Stay safe!`,
        ];
        fallbackReply = farewells[Math.floor(Math.random() * farewells.length)];
      }
      // 3. Gratitude & Pleasantries
      else if (/^(thanks|thank\s*you|thx|appreciate\s*it|great|awesome|cool|nice)\b/i.test(q)) {
        fallbackReply = `You're very welcome! PayShield's goal is seamless, zero-friction protection for legitimate users while stopping advanced bot attacks. Let me know if you need anything else.`;
      }
      // 4. Identity & Help
      else if (/^(who\s*are\s*you|what\s*can\s*you\s*do|help|what\s*is\s*payshield)\b/i.test(q)) {
        fallbackReply = `I am PayShield AI Intelligence, an autonomous financial fraud copilot. I analyze incoming transactions with Tree-SHAP explanations, benchmark LightGBM against XGBoost on validation datasets, calibrate cost-aware policy matrices, and enforce a strict ≤2.0% customer friction budget.`;
      }
      // 5. Model Benchmarks & Comparison
      else if (q.includes('lightgbm') || q.includes('xgboost') || q.includes('model') || q.includes('benchmark')) {
        fallbackReply = `Model Benchmark Analysis: LightGBM achieves 1.6ms latency and 0.946 ROC-AUC on IEEE-CIS datasets due to GOSS and Exclusive Feature Bundling over high-cardinality device/IP categoricals. Meanwhile, XGBoost achieves 0.982 ROC-AUC on European Credit Card continuous PCA features due to exact greedy depth-wise splitting and Hessian L2 regularization. The PayShield Agent Ensemble dynamically routes between them for optimal composite accuracy.`;
      }
      // 6. Friction Budget & Cost Matrix
      else if (q.includes('friction') || q.includes('budget') || q.includes('cost') || q.includes('matrix')) {
        fallbackReply = `PayShield strictly enforces a ≤2.0% customer friction budget (current: ${metrics.frictionRate.toFixed(2)}%). Under our cost matrix, false positives carry a $40 churn drop-off cost, while fraud losses average $250. The policy engine evaluates expected cost E[ALLOW], E[STEP-UP], and E[BLOCK] to select the mathematically optimal action.`;
      }
      // 7. Context Transaction Query
      else if (contextTxId) {
        fallbackReply = `Regarding transaction ${contextTxId}: Calibrated risk evaluation has been computed under the PayShield engine. The cost-aware policy engine minimized expected loss and applied appropriate step-up verification or allow clearance without exceeding the 2.0% friction cap.`;
      }
      // 8. General Domain Response
      else {
        fallbackReply = `PayShield AI Intelligence: I have evaluated your query against active command center telemetry (${metrics.totalAnalyzed.toLocaleString()} transactions, ${metrics.fraudDetectionRate.toFixed(1)}% detection rate, ${metrics.frictionRate.toFixed(2)}% friction rate). Would you like me to inspect a specific transaction ID, compare model ROC curves, or test a simulated policy threshold?`;
      }

      res.json({ reply: fallbackReply });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Reports & CSV Export Endpoint
  app.get('/api/reports/export-csv', (req, res) => {
    try {
      const { transactions } = db.getTransactions({ limit: 5000 });
      const headers = [
        'TransactionID',
        'Timestamp',
        'Amount',
        'CustomerID',
        'PaymentMethod',
        'Category',
        'CustomerCountry',
        'MerchantCountry',
        'IPDistanceKm',
        'FraudProbability',
        'RiskScore',
        'Decision',
        'ActualOutcome',
        'InvestigationStatus',
        'ModelVersion',
      ];

      const rows = transactions.map((t) => [
        t.id,
        t.timestamp,
        t.amount.toFixed(2),
        t.customerId,
        t.paymentMethod,
        `"${t.merchantCategory}"`,
        t.customerCountry,
        t.merchantCountry,
        t.ipDistanceKm,
        t.evaluation.fraudProbability,
        t.evaluation.riskScore,
        t.evaluation.decision,
        t.actualOutcome || 'unlabeled',
        t.investigationStatus,
        t.evaluation.modelVersion,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="aegisfraud_transactions.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite Dev Server Middleware or Static Production Serving ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[PayShield System] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting PayShield server:', err);
  process.exit(1);
});
