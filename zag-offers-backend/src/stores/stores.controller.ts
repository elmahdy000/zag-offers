import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  Logger,
} from '@nestjs/common';

import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, StoreStatus, Prisma } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CacheInterceptor } from '@nestjs/cache-manager';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('stores (نظام المحلات)')
@Controller('stores')
export class StoresController {
  private readonly logger = new Logger(StoresController.name);

  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء محل جديد' })
  async create(
    @Body() dto: CreateStoreDto,
    @Request() req: { user: { id: string } },
  ) {
    try {
      return await this.storesService.create({
        name: dto.name,
        address: dto.address,
        area: dto.area,
        phone: dto.phone,
        logo: dto.logo,
        coverImage: dto.coverImage,
        lat: dto.lat,
        lng: dto.lng,
        whatsapp: dto.whatsapp,
        category: { connect: { id: dto.categoryId } },
        owner: { connect: { id: req.user.id } },
      });
    } catch (e: unknown) {
      const error = e as Error;
      this.logger.error(
        `Store create failed for user ${req.user.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'عرض كل المحلات المعتمدة' })
  findAll(
    @Query('area') area?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('includeMeta') includeMeta?: string,
  ) {
    const skip = (page - 1) * limit;
    return this.storesService.findAll({
      where: {
        status: StoreStatus.APPROVED,
        area: area,
        categoryId: categoryId,
      },
      skip: +skip,
      take: +limit,
      page: +page,
      limit: +limit,
      includeMeta: includeMeta === 'true',
    });
  }

  @Get('categories')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'عرض كل الأقسام' })
  getCategories() {
    return this.storesService.findCategories();
  }

  @Get('my-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إحصائيات لوحة تحكم التاجر' })
  async getDashboardStats(@Request() req: { user: { id: string } }) {
    return this.storesService.getVendorDashboardStats(req.user.id);
  }

  @Get('my-stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض جميع متاجر التاجر' })
  async getMerchantStores(@Request() req: { user: { id: string } }) {
    return this.storesService.getMerchantStores(req.user.id);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'عرض بيانات محل معين' })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث بيانات المحل (للتاجر)' })
  updateStore(
    @Param('id') id: string,
    @Body() data: Prisma.StoreUpdateInput,
    @Request() req: { user: { id: string } },
  ) {
    return this.storesService.updateStoreDetails(id, req.user.id, data);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث حالة المحل (للمدير فقط)' })
  updateStatus(@Param('id') id: string, @Body('status') status: StoreStatus) {
    return this.storesService.updateStatus(id, status);
  }
}

