import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { CurrentUser, HostJwtGuard } from '../auth/auth';
import { PortfoliosModule, PortfoliosService } from '../portfolios/portfolios.module';
import { GroqProvider } from './llm/groq.provider';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import type {
  LlmProvider,
  PortfolioGenInput,
  Section,
} from './llm/llm-provider.interface';

export class GenerateDto {
  @IsOptional()
  @IsIn(['all', 'headline', 'biography', 'skills', 'brand_summary'])
  section?: Section = 'all';
}

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async run(portfolioId: string, section: Section = 'all') {
    const p = await this.prisma.portfolio.findUniqueOrThrow({
      where: { id: portfolioId },
      include: { experiences: { orderBy: { sortOrder: 'asc' } } },
    });

    // PII (email/phone/dateOfBirth) is intentionally NOT sent to the model.
    const input: PortfolioGenInput = {
      fullName: p.fullName,
      profession: p.profession,
      gender: p.gender ?? undefined,
      location: p.location,
      description: p.description ?? undefined,
      experiences: p.experiences.map((e) => ({
        type: e.type,
        title: e.title,
        role: e.role ?? undefined,
        year: e.year ?? undefined,
        note: e.note ?? undefined,
      })),
      socials: {
        instagram: p.instagramUrl ?? undefined,
        facebook: p.facebookUrl ?? undefined,
        tiktok: p.tiktokUrl ?? undefined,
        youtube: p.youtubeUrl ?? undefined,
      },
      followers: {
        instagram: p.instagramFollowers ?? undefined,
        facebook: p.facebookFollowers ?? undefined,
        tiktok: p.tiktokFollowers ?? undefined,
        youtube: p.youtubeSubscribers ?? undefined,
      },
    };

    const job = await this.prisma.generationJob.create({
      data: {
        portfolioId,
        section,
        status: 'running',
        provider: process.env.AI_PROVIDER ?? 'groq',
        inputSnapshot: input as object,
      },
    });

    try {
      const { output, tokensUsed } = await this.withRetry(() =>
        this.llm.generate(input, section),
      );
      await this.prisma.$transaction([
        this.prisma.portfolio.update({
          where: { id: portfolioId },
          data: {
            headline: output.headline,
            biography: output.biography,
            skills: output.skills,
            brandSummary: output.brandSummary,
            status: 'ready',
          },
        }),
        this.prisma.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'succeeded',
            output: output as object,
            tokensUsed,
            completedAt: new Date(),
          },
        }),
      ]);
      return { jobId: job.id, status: 'succeeded', output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: { status: 'failed', error: message, completedAt: new Date() },
      });
      throw err;
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch {
      return await fn(); // one retry (handles transient errors / bad JSON)
    }
  }
}

@UseGuards(HostJwtGuard)
@Controller('portfolios/:id')
export class GenerationController {
  constructor(
    private readonly gen: GenerationService,
    private readonly portfolios: PortfoliosService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('generate')
  async generate(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: GenerateDto,
  ) {
    await this.portfolios.getOwned(userId, id); // ownership
    return this.gen.run(id, dto.section ?? 'all');
  }

  @Get('jobs/:jobId')
  async job(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
  ) {
    await this.portfolios.getOwned(userId, id);
    return this.prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  }
}

@Module({
  imports: [PortfoliosModule],
  controllers: [GenerationController],
  providers: [
    GenerationService,
    { provide: LLM_PROVIDER, useClass: GroqProvider },
  ],
})
export class GenerationModule {}
