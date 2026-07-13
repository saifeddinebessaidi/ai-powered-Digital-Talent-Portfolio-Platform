import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { CurrentUser, HostJwtGuard } from '../auth/auth';

const PROFESSIONS = [
  'actress',
  'actor',
  'model',
  'influencer',
  'content_creator',
  'other',
] as const;

export class UpdatePortfolioDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() dateOfBirth?: string; // ISO date
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsIn(PROFESSIONS as unknown as string[]) profession?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() instagramUrl?: string;
  @IsOptional() @IsString() facebookUrl?: string;
  @IsOptional() @IsString() tiktokUrl?: string;
  @IsOptional() @IsString() youtubeUrl?: string;
  @IsOptional() @IsInt() @Min(0) instagramFollowers?: number;
  @IsOptional() @IsInt() @Min(0) facebookFollowers?: number;
  @IsOptional() @IsInt() @Min(0) tiktokFollowers?: number;
  @IsOptional() @IsInt() @Min(0) youtubeSubscribers?: number;
  @IsOptional() @IsInt() @Min(0) reach?: number;
  @IsOptional() @IsInt() @Min(0) engagement?: number;
  // editable AI fields
  @IsOptional() @IsString() headline?: string;
  @IsOptional() @IsString() biography?: string;
  @IsOptional() skills?: string[];
  @IsOptional() @IsString() brandSummary?: string;
  // portfolio display fields (French template)
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() availabilityText?: string;
  @IsOptional() @IsString() availabilityDate?: string;
  @IsOptional() @IsString() resumeUrl?: string;
  @IsOptional() @IsString() addressText?: string;
  // privacy
  @IsOptional() @IsBoolean() showPhone?: boolean;
  @IsOptional() @IsBoolean() showDob?: boolean;
}

@Injectable()
export class PortfoliosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create-or-get the current user's portfolio (one per user in the MVP). */
  async ensureForUser(userId: string) {
    const existing = await this.prisma.portfolio.findUnique({ where: { userId } });
    if (existing) return existing;
    try {
      return await this.prisma.portfolio.create({
        data: {
          userId,
          fullName: '',
          // Pre-filled REACCHY defaults; editable per talent.
          email: 'Hello@reacchy.com',
          phone: '+21621020364',
          location: '',
          profession: 'other',
        },
      });
    } catch (e) {
      // Race-safe: two concurrent creates (e.g. React StrictMode double-effect)
      // → one wins, the other hits the unique constraint (P2002); just return the winner.
      if ((e as { code?: string }).code === 'P2002') {
        return this.prisma.portfolio.findUniqueOrThrow({ where: { userId } });
      }
      throw e;
    }
  }

  async getOwned(userId: string, id: string) {
    // Admin mode (DISABLE_AUTH): operate on any portfolio, not just the caller's.
    const where = process.env.DISABLE_AUTH === 'true' ? { id } : { id, userId };
    const p = await this.prisma.portfolio.findFirst({
      where,
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        experiences: { orderBy: { sortOrder: 'asc' } },
        pricing: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!p) throw new ForbiddenException();
    return p;
  }

  async update(userId: string, id: string, dto: UpdatePortfolioDto) {
    await this.getOwned(userId, id); // ownership check
    const data: Record<string, unknown> = { ...dto };
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    return this.prisma.portfolio.update({ where: { id }, data: data as never });
  }
}

@UseGuards(HostJwtGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly svc: PortfoliosService) {}

  @Post()
  create(@CurrentUser() userId: string) {
    return this.svc.ensureForUser(userId);
  }

  @Get(':id')
  get(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.svc.getOwned(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.svc.update(userId, id, dto);
  }
}

@Module({
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
