import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'Company or freelancer name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'Primary contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
