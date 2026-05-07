import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TenantReportDto } from './dto/tenant-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import type { Response } from 'express';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('tenant/:id/summary')
  @ApiOperation({ summary: 'Generate tenant summary report' })
  @ApiOkResponse({ type: TenantReportDto })
  tenantSummary(@Param('id') id: string, @Query() query: ReportQueryDto) {
    return this.reportsService.tenantSummary(id, query);
  }

  @Get('tenant/:id/export')
  @ApiOperation({ summary: 'Export tenant report as CSV' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'CSV file download' })
  async exportTenantReport(
    @Param('id') id: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportTenantCsv(id, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tenant-report-${id}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  }

  @Get('platform/summary')
  @ApiOperation({ summary: 'Generate platform-wide summary report' })
  @ApiOkResponse({
    description: 'Platform KPIs and charts data',
    schema: {
      example: {
        kpis: {
          totalTenants: 42,
          activeTenants: 30,
          totalRevenue: 125000,
          averageMomentum: 72,
        },
        charts: {
          tenantGrowth: [],
          revenueByPlan: [],
          activityTrend: [],
        },
        generatedAt: '2025-06-01T12:00:00.000Z',
      },
    },
  })
  platformSummary(@Query() query: ReportQueryDto) {
    return this.reportsService.platformSummary(query);
  }

  @Get('platform/export')
  @ApiOperation({ summary: 'Export platform report as CSV' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'CSV file download' })
  async exportPlatformReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const csv = await this.reportsService.exportPlatformCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=platform-report-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  }
}
