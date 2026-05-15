import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, OfferStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { CacheInterceptor } from '@nestjs/cache-manager';
import { UseInterceptors } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post()
  @Throttle({ hourly: { limit: 10, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiResponse({ status: 201, description: 'تم إنشاء العرض بنجاح' })
  @ApiResponse({
    status: 429,
    description: 'تجاوزت الحد المسموح من إنشاء العروض (10/ساعة)',
  })
  async create(
    @Body() createOfferDto: CreateOfferDto,
    @Request() req: { user: { id: string } },
  ) {
    const { storeId: requestedStoreId, ...data } = createOfferDto;
    let storeId = requestedStoreId;

    if (!storeId) {
      const store = await this.offersService.getStoreByOwnerId(req.user.id);
      if (!store) {
        throw new NotFoundException('لا يوجد محل مسجل لهذا المستخدم');
      }
      storeId = store.id;
    }

    return this.offersService.create(
      {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        store: { connect: { id: storeId } },
      },
      req.user.id,
    );
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'List all active offers' })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('area') area?: string,
    @Query('featured') featured?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('includeMeta') includeMeta?: string,
  ) {
    const skip = (page - 1) * limit;
    return this.offersService.findAll({
      where: {
        status: OfferStatus.ACTIVE,
        store: {
          status: 'APPROVED',
          categoryId: categoryId,
          area: area,
        },
      },
      skip: +skip,
      take: +limit,
      page: +page,
      limit: +limit,
      includeMeta: includeMeta === 'true',
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant own offers' })
  findMyOffers(@Request() req: { user: { id: string } }) {
    return this.offersService.findMerchantOffers(req.user.id);
  }

  @Get('store/:storeId')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get offers by store ID' })
  findByStore(@Param('storeId') storeId: string) {
    return this.offersService.findAll({
      where: {
        storeId: storeId,
        status: OfferStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('search')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Search offers by keyword' })
  search(@Query('q') query: string) {
    return this.offersService.findAll({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { store: { name: { contains: query, mode: 'insensitive' } } },
        ],
        status: OfferStatus.ACTIVE,
      },
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get offer by ID' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user?: { id: string } },
  ) {
    return this.offersService.findOne(id, req.user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an offer' })
  update(
    @Param('id') id: string,
    @Body() data: UpdateOfferDto,
    @Request() req: { user: { id: string } },
  ) {
    const updateData: Prisma.OfferUpdateInput = { ...data };

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    return this.offersService.update(id, updateData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an offer' })
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.offersService.remove(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update offer status (Admin only)' })
  updateStatus(@Param('id') id: string, @Body('status') status: OfferStatus) {
    return this.offersService.updateStatus(id, status);
  }
}
