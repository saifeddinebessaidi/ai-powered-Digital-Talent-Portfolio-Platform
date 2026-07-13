import { z } from 'zod';
export declare const Profession: z.ZodEnum<["actress", "actor", "model", "influencer", "content_creator", "other"]>;
export declare const PortfolioGenOutput: z.ZodObject<{
    headline: z.ZodString;
    biography: z.ZodString;
    skills: z.ZodArray<z.ZodString, "many">;
    brandSummary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    headline: string;
    biography: string;
    skills: string[];
    brandSummary: string;
}, {
    headline: string;
    biography: string;
    skills: string[];
    brandSummary: string;
}>;
export type PortfolioGenOutput = z.infer<typeof PortfolioGenOutput>;
export declare const ExperienceEntry: z.ZodObject<{
    type: z.ZodEnum<["acting_credit", "brand_collab", "other"]>;
    title: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "other" | "acting_credit" | "brand_collab";
    title: string;
    role?: string | undefined;
    year?: string | undefined;
    note?: string | undefined;
}, {
    type: "other" | "acting_credit" | "brand_collab";
    title: string;
    role?: string | undefined;
    year?: string | undefined;
    note?: string | undefined;
}>;
export type ExperienceEntry = z.infer<typeof ExperienceEntry>;
export declare const PricingItemEntry: z.ZodObject<{
    category: z.ZodString;
    label: z.ZodString;
    priceMin: z.ZodOptional<z.ZodNumber>;
    priceMax: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: string;
    label: string;
    currency: string;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
}, {
    category: string;
    label: string;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
    currency?: string | undefined;
}>;
export type PricingItemEntry = z.infer<typeof PricingItemEntry>;
export declare const ProjectEntry: z.ZodObject<{
    title: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    featured: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    featured: boolean;
    category?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | undefined;
}, {
    title: string;
    category?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | undefined;
    featured?: boolean | undefined;
}>;
export type ProjectEntry = z.infer<typeof ProjectEntry>;
