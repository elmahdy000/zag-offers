import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CouponStatus, OfferStatus, Role, StoreStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats/global')
  @ApiOperation({ summary: 'Get global admin dashboard statistics' })
  async getGlobalStats() {
    const stats = await this.adminService.getGlobalStats();
    console.log('Backend: Admin Stats Requested:', stats);
    return stats;
  }

  @Get('stats/period')
  @ApiOperation({ summary: 'Get statistics for a given period' })
  @ApiQuery({
    name: 'period',
    enum: ['today', 'week', 'month'],
    required: false,
  })
  getStatsByPeriod(
    @Query('period') period: 'today' | 'week' | 'month' = 'week',
  ) {
    return this.adminService.getStatsByPeriod(period);
  }

  @Get('stats/top-categories')
  @ApiOperation({ summary: 'Get top categories by offer volume' })
  getTopCategories() {
    return this.adminService.getTopCategories();
  }

  @Get('stats/top-stores')
  @ApiOperation({ summary: 'Get top stores by performance' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getTopStores(@Query('limit') limit?: number) {
    return this.adminService.getTopStores(limit ? +limit : 10);
  }

  @Get('stats/merchant')
  @Roles(Role.MERCHANT, Role.ADMIN)
  @ApiOperation({ summary: 'Get merchant-specific statistics' })
  getMerchantStats(@Request() req: { user: { id: string } }) {
    return this.adminService.getMerchantStats(req.user.id);
  }

  @Get('stores')
  @ApiOperation({ summary: 'List stores with filters and pagination' })
  @ApiQuery({ name: 'status', enum: StoreStatus, required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'area', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getAllStores(
    @Query('status') status?: StoreStatus,
    @Query('categoryId') categoryId?: string,
    @Query('area') area?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllStores({
      status,
      categoryId,
      area,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('stores/pending')
  @ApiOperation({ summary: 'Get pending stores' })
  getPendingStores() {
    return this.adminService.getPendingStores();
  }

  @Post('stores')
  @ApiOperation({ summary: 'Create a new store as admin' })
  createStore(@Body() body: any) {
    return this.adminService.createStore(body);
  }

  @Get('stores/:id')
  @ApiOperation({ summary: 'Get full store details for admin' })
  getStoreDetails(@Param('id') id: string) {
    return this.adminService.getStoreDetails(id);
  }

  @Patch('stores/:id')
  @ApiOperation({ summary: 'Update store details as admin' })
  updateStore(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      address?: string;
      area?: string;
      phone?: string;
      whatsapp?: string;
      logo?: string;
      coverImage?: string;
      categoryId?: string;
      status?: StoreStatus;
    },
  ) {
    return this.adminService.updateStore(id, body);
  }

  @Patch('stores/:id/approve')
  @ApiOperation({ summary: 'Approve a store' })
  approveStore(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.approveStore(id, req.user.id);
  }

  @Patch('stores/:id/reject')
  @ApiOperation({ summary: 'Reject a store' })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  rejectStore(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.rejectStore(id, req.user.id, reason);
  }

  @Patch('stores/:id/suspend')
  @ApiOperation({ summary: 'Suspend a store' })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  suspendStore(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.suspendStore(id, reason);
  }

  @Delete('stores/:id')
  @ApiOperation({ summary: 'Delete a store' })
  deleteStore(@Param('id') id: string) {
    return this.adminService.deleteStore(id);
  }

  @Get('offers')
  @ApiOperation({ summary: 'List offers with filters and pagination' })
  @ApiQuery({ name: 'status', enum: OfferStatus, required: false })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getAllOffers(
    @Query('status') status?: OfferStatus,
    @Query('storeId') storeId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllOffers({
      status,
      storeId,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('offers/pending')
  @ApiOperation({ summary: 'Get pending offers' })
  getPendingOffers() {
    return this.adminService.getPendingOffers();
  }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get full offer details for admin' })
  getOfferDetails(@Param('id') id: string) {
    return this.adminService.getOfferDetails(id);
  }

  @Patch('offers/:id')
  @ApiOperation({ summary: 'Update offer details as admin' })
  updateOffer(
    @Param('id') id: string,
    @Body() body: UpdateOfferDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.updateOffer(id, body, req.user.id);
  }

  @Patch('offers/:id/approve')
  @ApiOperation({ summary: 'Approve an offer' })
  approveOffer(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.approveOffer(id, req.user.id);
  }

  @Patch('offers/:id/reject')
  @ApiOperation({ summary: 'Reject an offer' })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  rejectOffer(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.rejectOffer(id, req.user.id, reason);
  }

  @Delete('offers/:id')
  @ApiOperation({ summary: 'Delete an offer' })
  deleteOffer(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.deleteOffer(id, req.user.id);
  }

  @Get('users')
  @ApiOperation({ summary: 'List users with filters and pagination' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getAllUsers(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllUsers({
      role,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user details' })
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create new user' })
  createUser(@Body() data: CreateUserDto) {
    return this.adminService.createUser(data);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user profile' })
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.adminService.updateUser(id, data);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiBody({
    schema: {
      properties: {
        role: { type: 'string', enum: ['CUSTOMER', 'MERCHANT', 'ADMIN'] },
      },
    },
  })
  changeUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.adminService.changeUserRole(id, role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories' })
  getAllCategories() {
    return this.adminService.getAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create category' })
  @ApiBody({ schema: { properties: { name: { type: 'string' } } } })
  createCategory(
    @Body('name') name: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.createCategory(name, req.user.id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category name' })
  updateCategory(
    @Param('id') id: string,
    @Body('name') name: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.updateCategory(id, name, req.user.id);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.deleteCategory(id, req.user.id);
  }

  @Get('coupons')
  @ApiOperation({ summary: 'List coupons with filters and pagination' })
  @ApiQuery({ name: 'status', enum: CouponStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAllCoupons(
    @Query('status') status?: CouponStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAllCoupons({
      status,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('coupons/:id')
  @ApiOperation({ summary: 'Get coupon details for admin' })
  getCouponDetails(@Param('id') id: string) {
    return this.adminService.getCouponDetails(id);
  }

  @Delete('coupons/:id')
  @ApiOperation({ summary: 'Delete a coupon record' })
  deleteCoupon(@Param('id') id: string) {
    return this.adminService.deleteCoupon(id);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast announcement to users' })
  @ApiBody({
    schema: {
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        area: { type: 'string' },
      },
    },
  })
  broadcastAnnouncement(
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('area') area: string,
    @Body('imageUrl') imageUrl: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.broadcastAnnouncement({
      title,
      body,
      area,
      imageUrl,
      adminId: req.user.id,
    });
  }
}
