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
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, OfferStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CacheInterceptor } from '@nestjs/cache-manager';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('offers')
@Controller('offers')
@UseInterceptors(CacheInterceptor)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new offer' })
  async create(
    @Body() createOfferDto: CreateOfferDto,
    @Request() req: { user: { id: string } },
  ) {
    const { storeId: requestedStoreId, ...data } = createOfferDto;
    let storeId = requestedStoreId;

    if (!storeId) {
      const store = await this.offersService.getStoreByOwnerId(req.user.id);
      if (!store) {
        throw new Error('لا يوجد محل مسجل لهذا المستخدم');
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
  @ApiOperation({ summary: 'List all active offers' })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('area') area?: string,
    @Query('featured') featured?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    return this.offersService.findAll({
      where: {
        status: OfferStatus.ACTIVE,
        store: {
          categoryId: categoryId,
          area: area,
        },
      },
      skip: +skip,
      take: +limit,
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
  @ApiOperation({ summary: 'Search offers by keyword' })
  search(@Query('q') query: string) {
    return this.offersService.findAll({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        status: OfferStatus.ACTIVE,
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by ID' })
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an offer' })
  update(
    @Param('id') id: string,
    @Body() data: Prisma.OfferUpdateInput,
    @Request() req: { user: { id: string } },
  ) {
    return this.offersService.update(id, data, req.user.id);
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
