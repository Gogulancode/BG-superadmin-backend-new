import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Company or freelancer name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'Primary contact email' })
  @IsEmail()
  email: string;
}
