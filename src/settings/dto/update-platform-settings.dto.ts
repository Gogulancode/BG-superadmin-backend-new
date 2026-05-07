import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, ValidateNested } from 'class-validator';

export class PlanLimitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  FREE?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  STARTER?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  PRO?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  ENTERPRISE?: number;
}

export class PlatformFeatureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  auditLogging?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;
}

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({ enum: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] })
  @IsOptional()
  @IsIn(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'])
  defaultPlan?: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

  @ApiPropertyOptional({ type: PlanLimitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanLimitDto)
  maxTenantsPerPlan?: Partial<Record<'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE', number>>;

  @ApiPropertyOptional({ type: PlatformFeatureDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlatformFeatureDto)
  features?: Partial<Record<'mfaEnabled' | 'auditLogging' | 'emailNotifications', boolean>>;
}
