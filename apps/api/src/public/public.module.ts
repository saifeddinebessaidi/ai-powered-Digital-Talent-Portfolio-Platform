import {
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getBySlug(slug: string) {
    const p = await this.prisma.portfolio.findFirst({
      where: { slug, status: 'published' },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        experiences: { orderBy: { sortOrder: 'asc' } },
        pricing: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException();

    return {
      fullName: p.fullName,
      profession: p.profession,
      location: p.location,
      tagline: p.tagline,
      headline: p.headline,
      biography: p.biography,
      skills: p.skills,
      brandSummary: p.brandSummary,
      availabilityText: p.availabilityText,
      availabilityDate: p.availabilityDate,
      resumeUrl: p.resumeUrl,
      addressText: p.addressText,
      photos: p.photos.map((ph) => ({ url: ph.url, isCover: ph.isCover })),
      experiences: p.experiences.map((e) => ({
        type: e.type,
        title: e.title,
        role: e.role,
        year: e.year,
      })),
      pricing: p.pricing.map((pi) => ({
        category: pi.category,
        label: pi.label,
        priceMin: pi.priceMin,
        priceMax: pi.priceMax,
        currency: pi.currency,
      })),
      projects: p.projects.map((pr) => ({
        title: pr.title,
        category: pr.category,
        description: pr.description,
        imageUrl: pr.imageUrl,
        featured: pr.featured,
      })),
      socials: {
        instagram: p.instagramUrl,
        facebook: p.facebookUrl,
        tiktok: p.tiktokUrl,
        youtube: p.youtubeUrl,
      },
      metrics: {
        instagramFollowers: p.instagramFollowers,
        facebookFollowers: p.facebookFollowers,
        tiktokFollowers: p.tiktokFollowers,
        youtubeSubscribers: p.youtubeSubscribers,
      },
      contact: { email: p.email, phone: p.showPhone ? p.phone : null },
    };
  }
}

// Public, unauthenticated read.
@Controller('public/portfolios')
export class PublicController {
  constructor(private readonly svc: PublicService) {}

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug);
  }
}

@Module({
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
