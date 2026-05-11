import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('recommendations (نظام الترشيحات الذكي)')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'الحصول على عروض مرشحة لك (بناءً على اهتماماتك ومنطقتك)',
  })
  @ApiResponse({ status: 200, description: 'ترجع قائمة بـ 10 عروض مرشحة' })
  getRecommendations(@Request() req: { user?: { id: string } }) {
    return this.recommendationsService.getRecommendedOffers(req.user?.id);
  }

  @Get('trending')
  @ApiOperation({ summary: 'العروض الأكثر رواجاً (Trending)' })
  @ApiResponse({ status: 200, description: 'ترجع العروض الأكثر إضافة للمفضلة' })
  getTrending() {
    return this.recommendationsService.getTrendingOffers();
  }
}
