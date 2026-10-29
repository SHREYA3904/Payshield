/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { DecisionResult, TransactionInput } from '../types/fraud.js';

export class GeminiExplanationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  /**
   * Generates a grounded, auditor-ready natural language decision explanation.
   * Strictly references the calculated probability, SHAP values, expected costs,
   * and policy rules without hallucinating unobserved evidence.
   */
  public async generateExplanation(
    tx: TransactionInput,
    evaluation: Omit<DecisionResult, 'aiExplanation'>
  ): Promise<string> {
    const topShap = evaluation.shapValues?.slice(0, 4) || [];
    const shapSummary = topShap.length > 0
      ? topShap
          .map(
            (s) =>
              `• ${s.feature} (${s.value}): ${s.contribution > 0 ? '+' : ''}${s.contribution.toFixed(2)} log-odds impact [${s.description}]`
          )
          .join('\n')
      : '• Features within standard statistical tolerance.';

    const allowCost = evaluation.expectedCosts?.ALLOW?.expectedCost?.toFixed(2) ?? '0.00';
    const stepUpCost = evaluation.expectedCosts?.['STEP-UP']?.expectedCost?.toFixed(2) ?? '0.00';
    const blockCost = evaluation.expectedCosts?.BLOCK?.expectedCost?.toFixed(2) ?? '0.00';
    const costSummary = `ALLOW Expected Cost: $${allowCost} | STEP-UP Expected Cost: $${stepUpCost} | BLOCK Expected Cost: $${blockCost}`;

    // Fallback template that is always available and fully grounded
    const deterministicExplanation = `Decision: ${evaluation.decision} (Risk Score: ${evaluation.riskScore}/100, Fraud Probability: ${(evaluation.fraudProbability * 100).toFixed(1)}%).
Policy Rule: ${evaluation.policyRuleTriggered}
Financial Cost Trade-off: ${costSummary}.
Primary Drivers:
${shapSummary}
Actionable Recommendation: ${
      evaluation.decision === 'BLOCK'
        ? 'Immediately cancel authorization hold and request manual fraud analyst review before account suspension.'
        : evaluation.decision === 'STEP-UP'
        ? 'Trigger out-of-band biometric or SMS OTP challenge. If verified, auto-promote to ALLOW.'
        : 'Process transaction normally under standard batch clearing.'
    }`;

    if (!this.ai || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
      return deterministicExplanation;
    }

    try {
      const prompt = `You are the lead explainable AI engine for a tier-1 financial fraud defense architecture.
Explain this transaction decision clearly, concisely, and objectively for compliance auditors and risk analysts.
You must strictly cite the exact model outputs provided below without inventing hypothetical flags, scores, or external data.

TRANSACTION DETAILS:
- Amount: $${tx.amount}
- Customer ID: ${tx.customerId}
- Payment Method: ${tx.paymentMethod}
- Route: ${tx.customerCountry} -> ${tx.merchantCountry} (IP Distance: ${tx.ipDistanceKm} km)
- Device Type: ${tx.deviceType} (VPN/Proxy: ${tx.isVpnOrProxy ? 'YES' : 'NO'})
- Velocity: ${tx.velocity1h} tx/hr (1h), ${tx.velocity24h} tx/day (24h)

MODEL EVALUATION:
- Fraud Probability: ${(evaluation.fraudProbability * 100).toFixed(1)}%
- Calibrated Risk Score: ${evaluation.riskScore} / 100 (${evaluation.riskLevel})
- Final Policy Action: ${evaluation.decision}
- Governing Policy Rule: ${evaluation.policyRuleTriggered}
- Expected Costs: ${costSummary}
- Friction Budget Compliant: ${evaluation.frictionBudgetCompliant ? 'YES' : 'NO'} (Current Rate: ${evaluation.currentFrictionRate.toFixed(2)}%)

SHAP ATTRIBUTIONS (Top contributors):
${shapSummary}

Format your response in three crisp, professional sections:
1. Decision Rationale (1-2 sentences summarizing why ${evaluation.decision} was mandated by probability and policy).
2. Key Feature Drivers (Cite the specific SHAP factors and their direct behavioral impact).
3. Cost Impact & Recommended Action (Explain why the selected action minimizes expected financial & friction loss, and specify what the system or fraud analyst should do next).`;

      const apiCall = this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2, // Low temperature for factual precision
        },
      });

      // 3.5s timeout safeguard
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      const response = await Promise.race([apiCall, timeout]);

      if (response && response.text) {
        return response.text.trim();
      }
      return deterministicExplanation;
    } catch (err) {
      console.warn('Gemini explanation generation encountered an issue, using grounded fallback:', err);
      return deterministicExplanation;
    }
  }
}

export const geminiService = new GeminiExplanationService();
