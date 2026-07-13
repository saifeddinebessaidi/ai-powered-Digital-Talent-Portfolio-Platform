import { z } from 'zod';

export const Profession = z.enum([
  'actress', 'actor', 'model', 'influencer', 'content_creator', 'other',
]);

// AI generation output — the single source of truth for both apps
export const PortfolioGenOutput = z.object({
  headline: z.string().max(90),
  biography: z.string(),
  skills: z.array(z.string()).min(3).max(10),
  brandSummary: z.string(),
});
export type PortfolioGenOutput = z.infer<typeof PortfolioGenOutput>;

export const ExperienceEntry = z.object({
  type: z.enum(['acting_credit', 'brand_collab', 'other']),
  title: z.string(),
  role: z.string().optional(),
  year: z.string().optional(),
  note: z.string().optional(),
});
export type ExperienceEntry = z.infer<typeof ExperienceEntry>;

export const PricingItemEntry = z.object({
  category: z.string(),
  label: z.string(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  currency: z.string().default('TND'),
});
export type PricingItemEntry = z.infer<typeof PricingItemEntry>;

export const ProjectEntry = z.object({
  title: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  featured: z.boolean().default(false),
});
export type ProjectEntry = z.infer<typeof ProjectEntry>;