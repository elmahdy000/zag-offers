import { Global, Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PermissionsGuard } from '../common/permissions/permissions.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Global()
@Module({
  imports: [NotificationsModule, AuditLogModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PermissionsGuard],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
