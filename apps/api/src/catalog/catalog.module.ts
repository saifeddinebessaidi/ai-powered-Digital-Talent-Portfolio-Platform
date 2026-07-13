import {
  Body,
  Controller,
  ForbiddenException,
  Injectable,
  Module,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { CurrentUser, HostJwtGuard } from '../auth/auth';

class PricingItemDto {
  @IsString() category!: string;
  @IsString() label!: string;
  @IsOptional() @IsInt() @Min(0) priceMin?: number;
  @IsOptional() @IsInt() @Min(0) priceMax?: number;
  @IsOptional() @IsString() currency?: string;
}
export class ReplacePricingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingItemDto)
  pricing!: PricingItemDto[];
}

class ProjectDto {
  @IsString() title!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() featured?: boolean;
}
export class ReplaceProjectsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects!: ProjectDto[];
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwned(userId: string, portfolioId: string) {
    const where =
      process.env.DISABLE_AUTH === 'true'
        ? { id: portfolioId }
        : { id: portfolioId, userId };
    const owned = await this.prisma.portfolio.findFirst({
      where,
      select: { id: true },
    });
    if (!owned) throw new ForbiddenException();
  }

  async replacePricing(userId: string, portfolioId: string, dto: ReplacePricingDto) {
    await this.assertOwned(userId, portfolioId);
    await this.prisma.$transaction([
      this.prisma.pricingItem.deleteMany({ where: { portfolioId } }),
      this.prisma.pricingItem.createMany({
        data: dto.pricing.map((p, i) => ({
          portfolioId,
          category: p.category,
          label: p.label,
          priceMin: p.priceMin,
          priceMax: p.priceMax,
          currency: p.currency ?? 'TND',
          sortOrder: i,
        })),
      }),
    ]);
    return this.prisma.pricingItem.findMany({
      where: { portfolioId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async replaceProjects(userId: string, portfolioId: string, dto: ReplaceProjectsDto) {
    await this.assertOwned(userId, portfolioId);
    await this.prisma.$transaction([
      this.prisma.project.deleteMany({ where: { portfolioId } }),
      this.prisma.project.createMany({
        data: dto.projects.map((p, i) => ({
          portfolioId,
          title: p.title,
          category: p.category,
          description: p.description,
          imageUrl: p.imageUrl,
          featured: p.featured ?? false,
          sortOrder: i,
        })),
      }),
    ]);
    return this.prisma.project.findMany({
      where: { portfolioId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

@UseGuards(HostJwtGuard)
@Controller('portfolios/:id')
export class CatalogController {
  constructor(private readonly svc: CatalogService) {}

  @Put('pricing')
  pricing(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: ReplacePricingDto,
  ) {
    return this.svc.replacePricing(userId, id, dto);
  }

  @Put('projects')
  projects(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: ReplaceProjectsDto,
  ) {
    return this.svc.replaceProjects(userId, id, dto);
  }
}

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
