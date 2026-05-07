import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches, IsOptional } from 'class-validator';

export class MfaCodeDto {
  @ApiProperty({ description: '6-digit TOTP code', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be exactly 6 digits' })
  code: string;
}

export class MfaDisableDto {
  @ApiProperty({ description: '6-digit TOTP code', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be exactly 6 digits' })
  code: string;

  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  password: string;
}

export class MfaLoginDto {
  @ApiProperty({ description: '6-digit TOTP code', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be exactly 6 digits' })
  code: string;

  @ApiProperty({ description: 'Temporary token from initial login' })
  @IsString()
  tempToken: string;
}

export class MfaEnrollResponseDto {
  @ApiProperty({ description: 'Base32-encoded secret for manual entry' })
  secret: string;

  @ApiProperty({ description: 'OTPAuth URL for QR code generation' })
  otpauthUrl: string;

  @ApiProperty({ description: 'Display label for authenticator app' })
  label: string;
}

export class MfaStatusDto {
  @ApiProperty({ description: 'Whether MFA is enabled for the user' })
  isMfaEnabled: boolean;

  @ApiPropertyOptional({ description: 'Last time MFA was verified' })
  lastMfaVerifiedAt?: Date;
}
