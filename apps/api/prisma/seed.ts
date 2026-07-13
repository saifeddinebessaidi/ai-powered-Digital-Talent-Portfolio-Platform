import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// 3 deliberately DISTINCT users — proves generation is per-user (no mixing).
const USERS = [
  {
    userId: 'seed-lina',
    fullName: 'Lina Ben Salah',
    gender: 'female',
    email: 'lina@example.com',
    phone: '+216 21 020 364',
    location: 'Tunis, Tunisie',
    profession: 'influencer',
    description:
      'Créatrice de contenu lifestyle et beauté, passionnée par la mode tunisienne et les voyages.',
    instagramUrl: 'https://instagram.com/lina',
    facebookUrl: 'https://facebook.com/lina',
    tiktokUrl: 'https://tiktok.com/@lina',
    instagramFollowers: 185000,
    facebookFollowers: 64000,
    tiktokFollowers: 92000,
    experiences: [
      { type: 'brand_collab', title: 'Maison Aziza', role: 'Campagne', year: '2024' },
      { type: 'brand_collab', title: 'Tunisie Telecom', role: 'Ambassadrice', year: '2023' },
    ],
    pricing: [
      { category: 'reels', label: 'Reel Instagram', priceMin: 800, priceMax: 1500, currency: 'TND' },
      { category: 'live', label: 'Live / Story', priceMin: 400, priceMax: 700, currency: 'TND' },
    ],
    projects: [
      { title: 'Campagne Ramadan', category: 'Mode', description: 'Série de contenus pour le Ramadan.', featured: true },
    ],
  },
  {
    userId: 'seed-yassine',
    fullName: 'Yassine Marchetti',
    gender: 'male',
    email: 'yassine@example.com',
    phone: '+33 6 12 34 56 78',
    location: 'Paris, France',
    profession: 'actor',
    description:
      'Acteur formé au théâtre, attiré par le cinéma indépendant et les rôles à forte intensité dramatique.',
    instagramUrl: 'https://instagram.com/yassine',
    youtubeUrl: 'https://youtube.com/@yassine',
    instagramFollowers: 42000,
    experiences: [
      { type: 'acting_credit', title: 'La Nuit Venue', role: 'Premier rôle', year: '2024' },
      { type: 'acting_credit', title: 'Les Ombres', role: 'Second rôle', year: '2022' },
    ],
    pricing: [
      { category: 'events', label: 'Événement / Apparition', priceMin: 1500, priceMax: 3000, currency: 'EUR' },
    ],
    projects: [
      { title: 'La Nuit Venue', category: 'Cinéma', description: 'Long-métrage indépendant.', featured: true },
    ],
  },
  {
    userId: 'seed-nour',
    fullName: 'Nour Khelifi',
    gender: 'female',
    email: 'nour@example.com',
    phone: '+33 7 98 76 54 32',
    location: 'Lyon, France',
    profession: 'model',
    description:
      'Mannequin spécialisée en éditorial et campagnes de marques, basée à Lyon.',
    instagramUrl: 'https://instagram.com/nour',
    instagramFollowers: 73000,
    experiences: [
      { type: 'brand_collab', title: 'Maison X', role: 'Campagne printemps', year: '2023' },
    ],
    pricing: [
      { category: 'reels', label: 'Shooting + Reel', priceMin: 600, priceMax: 1200, currency: 'EUR' },
    ],
    projects: [],
  },
  {
    userId: 'seed-amira',
    fullName: 'Amira Cherif',
    gender: 'female',
    email: 'amira@example.com',
    phone: '+216 22 145 879',
    location: 'Sousse, Tunisie',
    profession: 'actress',
    description:
      'Comédienne de théâtre et de télévision, attirée par les rôles dramatiques et les productions tunisiennes.',
    instagramUrl: 'https://instagram.com/amira',
    instagramFollowers: 56000,
    experiences: [
      { type: 'acting_credit', title: 'El Foundou', role: 'Rôle principal', year: '2023' },
      { type: 'acting_credit', title: 'Théâtre Municipal de Tunis', role: 'Comédienne', year: '2021' },
    ],
    pricing: [
      { category: 'events', label: 'Apparition / Événement', priceMin: 1000, priceMax: 2500, currency: 'TND' },
    ],
    projects: [
      { title: 'El Foundou', category: 'Télévision', description: 'Série dramatique tunisienne.', featured: true },
    ],
  },
  {
    userId: 'seed-karim',
    fullName: 'Karim Haddad',
    gender: 'male',
    email: 'karim@example.com',
    phone: '+216 50 332 118',
    location: 'Sfax, Tunisie',
    profession: 'content_creator',
    description:
      'Créateur de contenu tech et gaming, vidéos YouTube et lives quotidiens autour du jeu vidéo.',
    youtubeUrl: 'https://youtube.com/@karim',
    tiktokUrl: 'https://tiktok.com/@karim',
    youtubeSubscribers: 210000,
    tiktokFollowers: 140000,
    experiences: [
      { type: 'brand_collab', title: 'Logitech', role: 'Partenariat matériel', year: '2024' },
    ],
    pricing: [
      { category: 'reels', label: 'Vidéo intégrée', priceMin: 1200, priceMax: 2800, currency: 'TND' },
      { category: 'live', label: 'Live sponsorisé', priceMin: 600, priceMax: 1000, currency: 'TND' },
    ],
    projects: [],
  },
  {
    userId: 'seed-ines',
    fullName: 'Inès Bouazizi',
    gender: 'female',
    email: 'ines@example.com',
    phone: '+33 6 45 78 12 90',
    location: 'Marseille, France',
    profession: 'influencer',
    description:
      'Influenceuse mode et beauté franco-tunisienne, contenus lifestyle et collaborations avec des marques européennes.',
    instagramUrl: 'https://instagram.com/ines',
    tiktokUrl: 'https://tiktok.com/@ines',
    instagramFollowers: 320000,
    tiktokFollowers: 410000,
    experiences: [
      { type: 'brand_collab', title: 'Sephora', role: 'Ambassadrice', year: '2024' },
      { type: 'brand_collab', title: 'Zara', role: 'Campagne', year: '2023' },
    ],
    pricing: [
      { category: 'reels', label: 'Reel Instagram', priceMin: 1500, priceMax: 3500, currency: 'EUR' },
      { category: 'events', label: 'Présence événement', priceMin: 2000, priceMax: 5000, currency: 'EUR' },
    ],
    projects: [
      { title: 'Collection capsule', category: 'Mode', description: 'Collaboration sur une collection limitée.', featured: true },
    ],
  },
];

async function main() {
  for (const u of USERS) {
    const { experiences, pricing, projects, ...portfolio } = u;
    // upsert by userId so re-running the seed is idempotent
    const existing = await prisma.portfolio.findUnique({ where: { userId: u.userId } });
    if (existing) {
      await prisma.portfolio.delete({ where: { userId: u.userId } }); // cascade children
    }
    const created = await prisma.portfolio.create({ data: { ...portfolio, status: 'draft' } });
    if (experiences?.length) {
      await prisma.experience.createMany({
        data: experiences.map((e, i) => ({ ...e, portfolioId: created.id, sortOrder: i })),
      });
    }
    if (pricing?.length) {
      await prisma.pricingItem.createMany({
        data: pricing.map((p, i) => ({ ...p, portfolioId: created.id, sortOrder: i })),
      });
    }
    if (projects?.length) {
      await prisma.project.createMany({
        data: projects.map((p, i) => ({ ...p, portfolioId: created.id, sortOrder: i })),
      });
    }
    console.log(`seeded ${u.fullName} (${u.profession}, ${u.location}) -> ${created.id}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
