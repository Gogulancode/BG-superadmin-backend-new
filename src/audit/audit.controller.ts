import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Response } from 'express';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit log events with pagination' })
  @ApiOkResponse({
    description: 'Paginated audit events (descending by createdAt)',
    schema: {
      example: {
        data: [
          {
            id: 'audit_123',
            tenantId: 'tenant_123',
            actor: 'SUPER_ADMIN:admin@superadmin.com',
            eventType: 'TENANT_CREATED',
            metadata: { tenantName: 'Acme Corp' },
            createdAt: '2025-06-01T12:34:56.000Z',
            tenant: { name: 'Acme Corp' },
          },
        ],
        meta: {
          page: 1,
          pageSize: 50,
          total: 100,
          totalPages: 2,
        },
      },
    },
  })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'CSV file download' })
  async exportCsv(@Query() query: AuditQueryDto, @Res() res: Response) {
    const csv = await this.auditService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  }
}
