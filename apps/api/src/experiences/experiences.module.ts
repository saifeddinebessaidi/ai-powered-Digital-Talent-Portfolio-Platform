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
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { CurrentUser, HostJwtGuard } from '../auth/auth';

class ExperienceItemDto {
  @IsIn(['acting_credit', 'brand_collab', 'other']) type!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() year?: string;
  @IsOptional() @IsString() note?: string;
}

export class ReplaceExperiencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experiences!: ExperienceItemDto[];
}

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async replace(userId: string, portfolioId: string, dto: ReplaceExperiencesDto) {
    const owned = await this.prisma.portfolio.findFirst({
      where:
        process.env.DISABLE_AUTH === 'true'
          ? { id: portfolioId }
          : { id: portfolioId, userId },
      select: { id: true },
    });
    if (!owned) throw new ForbiddenException();

    await this.prisma.$transaction([
      this.prisma.experience.deleteMany({ where: { portfolioId } }),
      this.prisma.experience.createMany({
        data: dto.experiences.map((e, i) => ({
          portfolioId,
          type: e.type,
          title: e.title,
          role: e.role,
          year: e.year,
          note: e.note,
          sortOrder: i,
        })),
      }),
    ]);

    return this.prisma.experience.findMany({
      where: { portfolioId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

@UseGuards(HostJwtGuard)
@Controller('portfolios/:id/experiences')
export class ExperiencesController {
  constructor(private readonly svc: ExperiencesService) {}

  @Put()
  replace(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: ReplaceExperiencesDto,
  ) {
    return this.svc.replace(userId, id, dto);
  }
}

@Module({
  controllers: [ExperiencesController],
  providers: [ExperiencesService],
})
export class ExperiencesModule {}
