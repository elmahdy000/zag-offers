import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsGuard } from '../common/permissions/permissions.guard';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    EventsModule,
    NotificationsModule,
    AuditLogModule,
  ],
  providers: [AdminService, PermissionsGuard],
  controllers: [AdminController],
})
export class AdminModule {}

