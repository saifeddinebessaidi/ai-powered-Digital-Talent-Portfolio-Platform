import { PortfolioGenOutput } from '@portfolio/shared';

export interface PortfolioGenInput {
  fullName: string;
  profession: string;
  gender?: string;
  location: string;
  description?: string;
  experiences: {
    type: string;
    title: string;
    role?: string;
    year?: string;
    note?: string;
  }[];
  socials: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string };
  // self-reported follower counts (optional) — AI may reference factually
  followers?: { instagram?: number; facebook?: number; tiktok?: number; youtube?: number };
}

export type Section = 'all' | 'headline' | 'biography' | 'skills' | 'brand_summary';

export interface LlmProvider {
  generate(
    input: PortfolioGenInput,
    section?: Section,
  ): Promise<{ output: PortfolioGenOutput; tokensUsed?: number }>;
}

/** DI token for the active LLM provider. */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
