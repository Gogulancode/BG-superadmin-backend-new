import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@superadmin.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'superpassword123' })
  @IsString()
  @MinLength(6)
  password: string;
}