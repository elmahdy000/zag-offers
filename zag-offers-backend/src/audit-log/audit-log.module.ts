import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { PermissionsGuard } from '../common/permissions/permissions.guard';

@Global()
@Module({
  providers: [AuditLogService, PermissionsGuard],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
