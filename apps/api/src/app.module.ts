import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { PhotosModule } from './photos/photos.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { PublicModule } from './public/public.module';
import { GenerationModule } from './generation/generation.module';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PortfoliosModule,
    PhotosModule,
    ExperiencesModule,
    PublicModule,
    GenerationModule,
    AdminModule,
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
