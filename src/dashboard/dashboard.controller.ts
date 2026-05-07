import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'SuperAdmin dashboard summary' })
  @ApiOkResponse({
    description: 'Aggregated tenant metrics for dashboard cards',
    type: DashboardSummaryDto,
    schema: {
      example: {
        totalTenants: 42,
        activeTenants: 30,
        inactiveTenants: 12,
        createdLast7Days: 5,
        activityTrend: [
          { date: '2025-06-01', activeTenants: 4 },
          { date: '2025-06-02', activeTenants: 6 },
        ],
      },
    },
  })
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @ApiOperation({ summary: 'Support ticket list (optional)' })
  @ApiOkResponse({ description: 'Support tickets placeholder', schema: { example: [] } })
  @Get('support')
  listSupportTickets() {
    return this.dashboardService.listSupportTickets();
  }

  @ApiOperation({ summary: 'Audit log list (optional)' })
  @ApiOkResponse({ description: 'Audit logs placeholder', schema: { example: [] } })
  @Get('audit-log')
  listAuditLogs() {
    return this.dashboardService.listAuditLogs();
  }
}
