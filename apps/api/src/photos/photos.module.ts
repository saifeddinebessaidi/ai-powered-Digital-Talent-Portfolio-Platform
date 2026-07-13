import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { CurrentUser, HostJwtGuard } from '../auth/auth';

export class RegisterPhotoDto {
  @IsString() cloudinaryPublicId!: string;
  @IsString() url!: string;
  @IsOptional() @IsInt() width?: number;
  @IsOptional() @IsInt() height?: number;
  @IsOptional() @IsBoolean() isCover?: boolean;
}

export class UpdatePhotoDto {
  @IsOptional() @IsBoolean() isCover?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /** Short-lived params so the browser can upload directly to Cloudinary. */
  signUpload() {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'portfolios';
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET as string,
    );
    return {
      timestamp,
      folder,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  }

  async destroy(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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

  async register(userId: string, portfolioId: string, dto: RegisterPhotoDto) {
    await this.assertOwned(userId, portfolioId);
    if (dto.isCover) {
      await this.prisma.photo.updateMany({
        where: { portfolioId },
        data: { isCover: false },
      });
    }
    return this.prisma.photo.create({
      data: {
        portfolioId,
        cloudinaryPublicId: dto.cloudinaryPublicId,
        url: dto.url,
        width: dto.width,
        height: dto.height,
        isCover: dto.isCover ?? false,
      },
    });
  }

  async update(
    userId: string,
    portfolioId: string,
    photoId: string,
    dto: UpdatePhotoDto,
  ) {
    await this.assertOwned(userId, portfolioId);
    if (dto.isCover === true) {
      // Enforce a single cover in app logic (Postgres/Prisma, no partial index).
      await this.prisma.$transaction([
        this.prisma.photo.updateMany({
          where: { portfolioId },
          data: { isCover: false },
        }),
        this.prisma.photo.update({
          where: { id: photoId },
          data: { isCover: true, sortOrder: dto.sortOrder },
        }),
      ]);
      return this.prisma.photo.findUnique({ where: { id: photoId } });
    }
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { sortOrder: dto.sortOrder, isCover: dto.isCover },
    });
  }

  async remove(userId: string, portfolioId: string, photoId: string) {
    await this.assertOwned(userId, portfolioId);
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });
    if (photo) {
      await this.cloudinary.destroy(photo.cloudinaryPublicId);
      await this.prisma.photo.delete({ where: { id: photoId } });
    }
    return { deleted: true };
  }
}

@UseGuards(HostJwtGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Get('signature')
  signature() {
    return this.cloudinary.signUpload();
  }
}

@UseGuards(HostJwtGuard)
@Controller('portfolios/:id/photos')
export class PhotosController {
  constructor(private readonly svc: PhotosService) {}

  @Post()
  register(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: RegisterPhotoDto,
  ) {
    return this.svc.register(userId, id, dto);
  }

  @Patch(':photoId')
  update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Body() dto: UpdatePhotoDto,
  ) {
    return this.svc.update(userId, id, photoId, dto);
  }

  @Delete(':photoId')
  remove(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.svc.remove(userId, id, photoId);
  }
}

@Module({
  controllers: [UploadsController, PhotosController],
  providers: [PhotosService, CloudinaryService],
})
export class PhotosModule {}
