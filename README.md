# PayShield - AI-Powered Fraud Detection & Cost-Aware Decision System

PayShield is an enterprise-grade financial fraud defense and cost-aware decisioning system. It bridges machine learning risk prediction with economic decision theory: instead of relying on arbitrary static risk score cutoffs, the engine evaluates the expected monetary and operational costs of **ALLOW**, **STEP-UP (2FA/Challenge)**, and **BLOCK** decisions while enforcing a strict customer friction budget (&le; 2.0% legitimate transactions challenged). It supports dual LightGBM & XGBoost inference with dynamic agent routing across dataset archetypes.

---

## 1. System Architecture & Components

The application is architected into 8 decoupled, interoperable layers:

```
[ Transaction Ingestion ] (REST API / CSV Batch / Playground)
            │
            ▼
[ Feature Preprocessing & Scaling ]
            │
            ▼
[ Modular Fraud Engine ] (Calibrated GBDT Log-Odds + Sigmoid Prior Link)
            │
            ├──► [ Tree-SHAP Feature Attribution Engine ]
            │
            ▼
[ Cost-Aware Policy Engine ] ◄── [ Configurable Cost Matrix & Friction Budget ]
            │
            ├──► Deterministic Action: ALLOW | STEP-UP | BLOCK
            │
            ├──► [ Agentic AI Explainer (Gemini 3.8 Flash SDK) ]
            │
            ▼
[ Decision Logging & Audit Store ]
            │
            ├──► [ Fraud Analyst Investigation Workspace ] (Triage & Ground-Truth Labels)
            │
            ▼
[ Continuous Performance & Drift Monitor ] (Precision, Recall, F1, ROC-AUC, PSI)
            │
            ▼
[ Model Governance & Authorization Gate ] ──► [ Production Model Deployment ]
```

---

## 2. Mathematical Formulation of the Cost-Aware Policy Engine

For any incoming transaction $x$ with amount $A$ and estimated fraud probability $p = P(\text{fraud} \mid x)$:

### A. Expected Cost of ALLOW ($E[\text{ALLOW}]$)
If allowed, a fraudulent transaction causes direct loss of the transaction amount plus merchant chargeback penalties:
$$L_{\text{fraud}} = A \times \mu_{\text{fraud}} + C_{\text{chargeback}}$$
If legitimate, the loss is $\$0$.
$$E[\text{ALLOW}] = p \times L_{\text{fraud}}$$

### B. Expected Cost of BLOCK ($E[\text{BLOCK}]$)
If blocked, a fraudulent transaction incurs minimal operational recovery overhead ($C_{\text{admin}} \approx \$5$). However, if legitimate, a false positive causes customer goodwill damage, churn risk, and dispute overhead:
$$C_{\text{FP}} = C_{\text{churn}} + \alpha \times A$$
$$E[\text{BLOCK}] = p \times C_{\text{admin}} + (1 - p) \times C_{\text{FP}}$$

### C. Expected Cost of STEP-UP ($E[\text{STEP-UP}]$)
Additional verification (SMS OTP / Biometrics API) incurs a fixed technical cost $C_{\text{auth}}$. If the transaction is fraud, the fraudster fails with probability $\kappa \approx 0.88$; the remaining $(1 - \kappa)$ escapes. If legitimate, the user experiences slight friction and checkout drop-off risk $C_{\text{dropoff}}$:
$$E[\text{STEP-UP}] = C_{\text{auth}} + p \times (1 - \kappa) \times L_{\text{fraud}} + (1 - p) \times C_{\text{dropoff}}$$

### D. Friction Budget Constraint
The policy engine continuously computes the legitimate transaction challenge rate:
$$\text{Friction Rate} = \frac{\text{Legitimate Transactions Challenged}}{\text{Total Legitimate Transactions}} \times 100\%$$
If $\text{Friction Rate} > B_{\text{friction}}$ (default: 2.0%), the policy engine automatically throttles STEP-UP challenges for marginal risks to prevent harming legitimate merchant conversion.

---

## 3. Modular Fraud Detection & SHAP Explainability

The fraud detection service (`/src/server/fraudEngine.ts`) separates feature extraction from probability calibration.

### Tree-SHAP Additive Efficiency
The model computes exact additive feature contributions in the log-odds space:
$$f(x) = \beta_0 + \sum_{i=1}^M \phi_i(x)$$
where $\beta_0 = -3.65$ represents the population base log-odds ($\approx 2.5\%$ natural fraud prior), and each $\phi_i(x)$ is the Shapley attribution of feature $i$. The calibrated probability is:
$$p = \frac{1}{1 + e^{-f(x)}}, \quad \text{Risk Score} = \min(99, \max(1, \text{round}(p \times 100)))$$

---

## 4. REST API Documentation

### Ingestion & Evaluation
- `POST /api/transactions/evaluate`: Evaluates a single transaction in real time. Returns probability, risk score, cost matrix evaluations, SHAP values, and AI explanation.
- `POST /api/transactions/batch`: Evaluates an array of transaction records (used for CSV dataset ingestion).
- `GET /api/transactions`: Retrieves paginated transactions with multi-attribute filtering (date range, decision, risk level, status, search).
- `GET /api/transactions/:id`: Retrieves complete transaction dossier with SHAP attributions, policy cost breakdown, and investigation trail.

### Analyst Feedback & Triage
- `POST /api/transactions/:id/investigate`: Updates case status (`confirmed_fraud`, `confirmed_legitimate`, `under_review`, `unresolved`), notes, and evidence taxonomy tags.

### Policy Studio & Simulation
- `GET /api/policy`: Returns active cost matrix, thresholds, and policy version history.
- `POST /api/policy/simulate`: Replays historical transactions under proposed cost and threshold parameters. Returns cost delta, decision shifts, and projected friction rate.
- `POST /api/policy/update`: Deploys and archives policy versions with audit signatures.

### Model Monitoring & Governance
- `GET /api/models`: Returns registered model snapshots, confusion matrices, ROC-AUC, latency, and drift PSI metrics.
- `POST /api/models/deploy`: Authorizes promotion of candidate models to active production serving.

### Reports & Export
- `GET /api/reports/export-csv`: Streams a downloadable CSV of all transactions with ground truth and model decisions.
- `GET /api/metrics/overview`: Returns live KPI summary.

---

## 5. Integrating a Real Trained Model (Python / XGBoost / PyTorch)

To connect an external trained model:
1. Export your trained model artifact:
   - **XGBoost**: `model.save_model("model.json")`
   - **scikit-learn**: `joblib.dump(model, "model.joblib")`
   - **PyTorch / ONNX**: `torch.onnx.export(model, dummy_input, "fraud_model.onnx")`
2. Mount the inference service:
   - Run a lightweight FastAPI microservice or run ONNX Runtime in Node.js via `onnxruntime-node`.
   - Update `fraudEngine.predict(tx)` in `/src/server/fraudEngine.ts` to query your model's endpoint or local ONNX session.
   - Return `{ fraudProbability, riskScore, shapValues }` into the pipeline.
3. The Cost-Aware Policy Layer, Gemini Explainer, and Monitoring loops remain fully compatible without frontend or policy modifications.

---

## 6. Running Tests & Development

```bash
# Start full-stack development server (Express API + Vite SPA on port 3000)
npm run dev

# Run automated pipeline and policy test suite
npm test

# Build production bundle
npm run build

# Typecheck and lint codebase
npm run lint
```
