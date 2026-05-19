import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reviews (التقييمات والمراجعات)')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة تقييم جديد لمحل أو عرض' })
  create(
    @Body()
    createReviewDto: {
      storeId?: string;
      offerId?: string;
      rating: number;
      comment?: string;
      images?: string[];
    },
    @Request() req: { user: { id: string } },
  ) {
    return this.reviewsService.create({
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      images: createReviewDto.images || [],
      customer: { connect: { id: req.user.id } },
      store: createReviewDto.storeId
        ? { connect: { id: createReviewDto.storeId } }
        : undefined,
      offer: createReviewDto.offerId
        ? { connect: { id: createReviewDto.offerId } }
        : undefined,
    } as Prisma.ReviewCreateInput);
  }

  @Get('offer/:offerId')
  @ApiOperation({ summary: 'عرض كل التقييمات الخاصة بعرض معين' })
  findAllByOffer(@Param('offerId') offerId: string) {
    return this.reviewsService.findAllByOffer(offerId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'عرض كل التقييمات الخاصة بمحل معين' })
  findAllByStore(@Param('storeId') storeId: string) {
    return this.reviewsService.findAllByStore(storeId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف التقييم (صاحب التقييم أو الأدمن)' })
  remove(@Param('id') id: string, @Request() req: { user: { id: string; role?: string } }) {
    return this.reviewsService.remove(id, req.user.id, req.user.role);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الرد على تقييم (للتاجر أو الأدمن)' })
  addReply(
    @Param('id') id: string,
    @Body('reply') reply: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.reviewsService.addMerchantReply(id, req.user.id, reply);
  }
}
