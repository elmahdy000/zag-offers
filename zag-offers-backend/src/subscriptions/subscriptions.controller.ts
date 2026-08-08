import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Role, SubscriptionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../common/permissions/permissions.guard';
import { Permissions } from '../common/permissions/permissions.decorator';
import { ADMIN_PERMISSIONS as P } from '../common/permissions/admin-permissions';
import { SubscriptionsService } from './subscriptions.service';
import type { PlanInput } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('plans') getPlans() { return this.subscriptions.getPublicPlans(); }

  @Get('me') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.MERCHANT)
  getMine(@Request() req: { user: { id: string } }) { return this.subscriptions.getMerchantOverview(req.user.id); }

  @Post('request') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.MERCHANT)
  requestPlan(@Request() req: { user: { id: string } }, @Body() body: { planId: string; merchantNote?: string; paymentReference?: string; proofUrl?: string; paymentMethod?: string }) { return this.subscriptions.requestSubscription(req.user.id, body); }

  @Get('admin/plans') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  getAdminPlans() { return this.subscriptions.getAdminPlans(); }

  @Post('admin/plans') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  createPlan(@Body() body: PlanInput, @Request() req: { user: { id: string } }) { return this.subscriptions.createPlan(body, req.user.id); }

  @Patch('admin/plans/:id') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  updatePlan(@Param('id') id: string, @Body() body: Partial<PlanInput>, @Request() req: { user: { id: string } }) { return this.subscriptions.updatePlan(id, body, req.user.id); }

  @Get('admin/settings') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  getSettings() { return this.subscriptions.getSettings(); }

  @Patch('admin/settings') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  updateSettings(@Body() body: Parameters<SubscriptionsService['updateSettings']>[0], @Request() req: { user: { id: string } }) { return this.subscriptions.updateSettings(body, req.user.id); }

  @Get('admin/requests') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  getRequests(@Query('status') status?: SubscriptionStatus, @Query('page') page?: string, @Query('limit') limit?: string) { return this.subscriptions.getAdminSubscriptions({ status, page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20 }); }

  @Patch('admin/requests/:id/review') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  review(@Param('id') id: string, @Body() body: Parameters<SubscriptionsService['reviewSubscription']>[1], @Request() req: { user: { id: string } }) { return this.subscriptions.reviewSubscription(id, body, req.user.id); }

  @Patch('admin/requests/:id/cancel') @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN, Role.STAFF) @Permissions(P.SUBSCRIPTIONS_MANAGE)
  cancel(@Param('id') id: string, @Body('note') note: string | undefined, @Request() req: { user: { id: string } }) { return this.subscriptions.cancelSubscription(id, req.user.id, note); }
}
