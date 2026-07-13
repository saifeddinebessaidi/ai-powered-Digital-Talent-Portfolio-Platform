import { Controller, Get, Injectable, Module, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a fresh, blank portfolio for a NEW talent. Each gets its own unique
   * userId (the model is one-portfolio-per-userId), with the REACCHY contact
   * defaults pre-filled. Returns just the new id so the dashboard can open the form.
   */
  async createBlank() {
    const { id } = await this.prisma.portfolio.create({
      data: {
        userId: randomUUID(),
        fullName: '',
        email: 'Hello@reacchy.com',
        phone: '+21621020364',
        location: '',
        profession: 'other',
      },
      select: { id: true },
    });
    return { id };
  }

  /** Every portfolio row, minimal fields for the dashboard table. */
  async listPortfolios() {
    const rows = await this.prisma.portfolio.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        profession: true,
        location: true,
        status: true,
        slug: true,
        biography: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      profession: r.profession,
      location: r.location,
      status: r.status,
      slug: r.slug,
      hasGenerated: !!r.biography, // a portfolio was generated if it has AI bio
    }));
  }
}

// No auth for now (admin tool, single operator). DISABLE_AUTH guards the rest.
@Controller('admin/portfolios')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get()
  list() {
    return this.svc.listPortfolios();
  }

  @Post()
  create() {
    return this.svc.createBlank();
  }
}

@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
