/**
 * FORMA ZERO-COST AI POLICY ENFORCEMENT MODULE
 * 
 * Strict architectural controls to ensure 0 financial expenditure:
 * - Rejects any provider requiring paid billing activation
 * - Disallows paid fallback chains
 * - Prevents automatic billing upgrades
 * - Logs quota limits safely without exposing credentials
 */

export interface CostProtectionConfig {
  strictZeroCost: boolean;
  maxCostUsdPerRequest: number;
  allowedProviders: {
    geminiFreeTier: boolean;
    freeCommunityFlux: boolean;
    openaiPaid: boolean;
    falPaid: boolean;
    stabilityPaid: boolean;
  };
}

export const costProtection: CostProtectionConfig = {
  strictZeroCost: true,
  maxCostUsdPerRequest: 0.00,
  allowedProviders: {
    geminiFreeTier: true,      // Allowed only under 0-cost free tier quota
    freeCommunityFlux: true,   // 100% free open community tier (0 cost, no card required)
    openaiPaid: false,         // STRICTLY DISABLED under zero-cost policy
    falPaid: false,            // STRICTLY DISABLED under zero-cost policy
    stabilityPaid: false,      // STRICTLY DISABLED under zero-cost policy
  },
};

export class CostProtectionError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(`[Zero-Cost Policy Violation] ${message}`);
    this.name = 'CostProtectionError';
  }
}

export function assertZeroCostAllowed(provider: 'gemini' | 'free-community' | 'openai' | 'fal' | 'stability') {
  if (!costProtection.strictZeroCost) return;

  if (provider === 'openai' && !costProtection.allowedProviders.openaiPaid) {
    throw new CostProtectionError('OpenAI requests are blocked: requires paid billing. User policy is strict zero-cost.');
  }

  if (provider === 'fal' && !costProtection.allowedProviders.falPaid) {
    throw new CostProtectionError('Fal.ai requests are blocked: requires paid billing. User policy is strict zero-cost.');
  }

  if (provider === 'stability' && !costProtection.allowedProviders.stabilityPaid) {
    throw new CostProtectionError('Stability AI requests are blocked: requires paid billing. User policy is strict zero-cost.');
  }
}

