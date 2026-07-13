"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectEntry = exports.PricingItemEntry = exports.ExperienceEntry = exports.PortfolioGenOutput = exports.Profession = void 0;
const zod_1 = require("zod");
exports.Profession = zod_1.z.enum([
    'actress', 'actor', 'model', 'influencer', 'content_creator', 'other',
]);
// AI generation output — the single source of truth for both apps
exports.PortfolioGenOutput = zod_1.z.object({
    headline: zod_1.z.string().max(90),
    biography: zod_1.z.string(),
    skills: zod_1.z.array(zod_1.z.string()).min(3).max(10),
    brandSummary: zod_1.z.string(),
});
exports.ExperienceEntry = zod_1.z.object({
    type: zod_1.z.enum(['acting_credit', 'brand_collab', 'other']),
    title: zod_1.z.string(),
    role: zod_1.z.string().optional(),
    year: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
});
exports.PricingItemEntry = zod_1.z.object({
    category: zod_1.z.string(),
    label: zod_1.z.string(),
    priceMin: zod_1.z.number().int().min(0).optional(),
    priceMax: zod_1.z.number().int().min(0).optional(),
    currency: zod_1.z.string().default('TND'),
});
exports.ProjectEntry = zod_1.z.object({
    title: zod_1.z.string(),
    category: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    featured: zod_1.z.boolean().default(false),
});
