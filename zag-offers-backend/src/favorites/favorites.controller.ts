import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('favorites (المفضلة)')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle/:offerId')
  @ApiOperation({ summary: 'إضافة أو حذف عرض من المفضلة (Toggle)' })
  @ApiResponse({ status: 200, description: 'ترجع { favorited: true/false }' })
  toggle(
    @Param('offerId') offerId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.favoritesService.toggle(req.user.id, offerId);
  }

  @Get()
  @ApiOperation({ summary: 'عرض كل العروض المفضلة لدي' })
  findAll(@Request() req: { user: { id: string } }) {
    return this.favoritesService.findAllByUser(req.user.id);
  }
}
