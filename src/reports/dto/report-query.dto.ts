import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date for report range (ISO date)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for report range (ISO date)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
