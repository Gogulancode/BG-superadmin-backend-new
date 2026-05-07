import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OpsService } from './ops.service';

@ApiTags('Ops')
@Controller('ops')
export class OpsController {
  constructor(private opsService: OpsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get public system health' })
  @ApiOkResponse({ description: 'System health payload for operational monitoring' })
  getHealth() {
    return this.opsService.getHealth();
  }

  @Get('environment')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getEnvironment() {
    return this.opsService.getEnvironment();
  }

  @Get('rate-limits')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getRateLimits() {
    return this.opsService.getRateLimits();
  }

  @Get('telemetry')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getTelemetry() {
    return this.opsService.getTelemetry();
  }
}
