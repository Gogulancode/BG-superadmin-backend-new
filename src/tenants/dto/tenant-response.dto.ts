import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, TenantStatus } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty({ example: 'tenant_123' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiProperty({ example: 'owner@acme.com' })
  email: string;

  @ApiProperty({ enum: TenantStatus, example: TenantStatus.ACTIVE })
  status: TenantStatus;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.TRIAL })
  subscriptionStatus: SubscriptionStatus;

  @ApiProperty({ example: 'GROWTH', nullable: true })
  planCode?: string | null;

  @ApiProperty({ example: '2025-07-01T00:00:00.000Z', nullable: true })
  renewalDate?: Date | null;

  @ApiProperty({ example: '2025-06-15T00:00:00.000Z', nullable: true })
  trialEndsAt?: Date | null;

  @ApiProperty({ example: true, description: 'Whether the tenant has completed onboarding' })
  isOnboarded: boolean;

  @ApiProperty({ example: '2025-05-02T14:30:00.000Z', nullable: true, description: 'When onboarding was completed' })
  onboardedAt?: Date | null;

  @ApiProperty({ example: '2025-05-01T12:34:56.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-15T08:20:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: '2025-05-15T08:20:00.000Z', nullable: true })
  lastActiveAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Safe tenant activation details returned after create',
    example: {
      adminEmail: 'owner@acme.com',
      loginUrl: 'https://tenant.example.com/login',
      onboardingUrl: 'https://tenant.example.com/register?email=owner%40acme.com',
      passwordDelivery: 'Tenant admin creates their own password through the tenant onboarding flow.',
    },
  })
  provisioning?: {
    adminEmail: string;
    loginUrl: string;
    onboardingUrl: string;
    passwordDelivery: string;
  };
}
