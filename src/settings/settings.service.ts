import { Injectable } from '@nestjs/common';
import { AuditEventType, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

const SETTINGS_ID = 'platform';

const DEFAULT_LIMITS = {
  FREE: 10,
  STARTER: 100,
  PRO: 500,
  ENTERPRISE: 5000,
};

const DEFAULT_FEATURES = {
  mfaEnabled: true,
  auditLogging: true,
  emailNotifications: true,
};

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getPlatformSettings() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: SETTINGS_ID } });
    return this.toResponse(settings);
  }

  async updatePlatformSettings(dto: UpdatePlatformSettingsDto) {
    const previous = await this.getPlatformSettings();
    const next = {
      maintenanceMode: dto.maintenanceMode ?? previous.maintenanceMode,
      defaultPlan: dto.defaultPlan ?? previous.defaultPlan,
      maxTenantsPerPlan: {
        ...previous.maxTenantsPerPlan,
        ...(dto.maxTenantsPerPlan ?? {}),
      },
      features: {
        ...previous.features,
        ...(dto.features ?? {}),
      },
    };

    const saved = await this.prisma.platformSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        maintenanceMode: next.maintenanceMode,
        defaultPlan: next.defaultPlan,
        maxTenantsPerPlan: next.maxTenantsPerPlan,
        features: next.features,
      },
      update: {
        maintenanceMode: next.maintenanceMode,
        defaultPlan: next.defaultPlan,
        maxTenantsPerPlan: next.maxTenantsPerPlan,
        features: next.features,
      },
    });

    await this.auditService.logEvent({
      eventType: AuditEventType.SETTINGS_CHANGED,
      actor: 'SUPER_ADMIN',
      metadata: { previous, next },
    });

    return this.toResponse(saved);
  }

  private toResponse(settings: {
    id: string;
    maintenanceMode: boolean;
    defaultPlan: string;
    maxTenantsPerPlan: Prisma.JsonValue;
    features: Prisma.JsonValue;
    updatedAt?: Date;
  } | null) {
    return {
      id: settings?.id ?? SETTINGS_ID,
      maintenanceMode: settings?.maintenanceMode ?? false,
      defaultPlan: settings?.defaultPlan ?? 'STARTER',
      maxTenantsPerPlan: {
        ...DEFAULT_LIMITS,
        ...(this.asRecord(settings?.maxTenantsPerPlan) as Partial<typeof DEFAULT_LIMITS>),
      },
      features: {
        ...DEFAULT_FEATURES,
        ...(this.asRecord(settings?.features) as Partial<typeof DEFAULT_FEATURES>),
      },
      updatedAt: settings?.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private asRecord(value: Prisma.JsonValue | undefined): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
}
