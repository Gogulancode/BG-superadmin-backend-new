import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform settings' })
  @ApiOkResponse({ description: 'Current persisted platform settings' })
  getPlatformSettings() {
    return this.settingsService.getPlatformSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update platform settings' })
  @ApiOkResponse({ description: 'Updated platform settings' })
  updatePlatformSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.settingsService.updatePlatformSettings(dto);
  }
}
