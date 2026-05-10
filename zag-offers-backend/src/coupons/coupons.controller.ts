import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { GenerateCouponDto } from './dto/generate-coupon.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('coupons (نظام الكوبونات)')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('generate')
  @Throttle({ hourly: { limit: 20, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'استخراج كوبون جديد لعرض معين' })
  @ApiResponse({ status: 201, description: 'تم استخراج الكوبون بنجاح' })
  @ApiResponse({ status: 429, description: 'تجاوزت الحد المسموح من طلبات الكوبونات (20/ساعة)' })
  generate(
    @Body() generateCouponDto: GenerateCouponDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.couponsService.generate(generateCouponDto.offerId, req.user.id);
  }

  @Post('redeem')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تفعيل الكوبون (للتاجر فقط)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'ZAG-X7Y2Z' },
        storeId: { type: 'string', example: 'uuid-of-store' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'تم تفعيل الكوبون بنجاح' })
  @ApiResponse({
    status: 400,
    description: 'الكوبون منتهي أو مستخدم أو لا يخص هذا المحل',
  })
  @ApiResponse({ status: 429, description: 'تجاوزت الحد المسموح من محاولات التفعيل (5/ثانية)' })
  redeem(
    @Request() req: { user: { id: string } },
    @Body() body: RedeemCouponDto,
  ) {
    return this.couponsService.redeem(
      body.code,
      body.storeId || null,
      req.user.id,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض الكوبونات الخاصة بي (للعميل)' })
  findAll(@Request() req: { user: { id: string } }) {
    return this.couponsService.findAll(req.user.id);
  }

  @Get('merchant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض سجل الكوبونات الخاص بمحلي (للتاجر)' })
  findMerchantCoupons(@Request() req: { user: { id: string } }) {
    return this.couponsService.findMerchantCoupons(req.user.id);
  }

  @Get('by-code/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض بيانات كوبون بالكود (للتاجر)' })
  findByCode(
    @Param('code') code: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.couponsService.findByCode(code, req.user.id);
  }
}
