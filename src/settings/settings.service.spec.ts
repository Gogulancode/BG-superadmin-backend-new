import { Test } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: {
    platformSettings: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };
  let auditService: { logEvent: jest.Mock };

  beforeEach(async () => {
    prisma = {
      platformSettings: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    auditService = { logEvent: jest.fn().mockResolvedValue({ id: 'audit-1' }) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = moduleRef.get(SettingsService);
  });

  it('returns default platform settings when none have been saved', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue(null);

    const result = await service.getPlatformSettings();

    expect(result).toMatchObject({
      id: 'platform',
      maintenanceMode: false,
      defaultPlan: 'STARTER',
      maxTenantsPerPlan: {
        FREE: 10,
        STARTER: 100,
        PRO: 500,
        ENTERPRISE: 5000,
      },
      features: {
        mfaEnabled: true,
        auditLogging: true,
        emailNotifications: true,
      },
    });
  });

  it('merges partial updates, persists them, and writes an audit event', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue({
      id: 'platform',
      maintenanceMode: false,
      defaultPlan: 'STARTER',
      maxTenantsPerPlan: { FREE: 10, STARTER: 100, PRO: 500, ENTERPRISE: 5000 },
      features: { mfaEnabled: true, auditLogging: true, emailNotifications: true },
      updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    prisma.platformSettings.upsert.mockResolvedValue({
      id: 'platform',
      maintenanceMode: true,
      defaultPlan: 'PRO',
      maxTenantsPerPlan: { FREE: 10, STARTER: 100, PRO: 750, ENTERPRISE: 5000 },
      features: { mfaEnabled: true, auditLogging: true, emailNotifications: false },
      updatedAt: new Date('2026-05-07T00:00:00.000Z'),
    });

    const result = await service.updatePlatformSettings({
      maintenanceMode: true,
      defaultPlan: 'PRO',
      maxTenantsPerPlan: { PRO: 750 },
      features: { emailNotifications: false },
    });

    expect(prisma.platformSettings.upsert).toHaveBeenCalledWith({
      where: { id: 'platform' },
      create: {
        id: 'platform',
        maintenanceMode: true,
        defaultPlan: 'PRO',
        maxTenantsPerPlan: { FREE: 10, STARTER: 100, PRO: 750, ENTERPRISE: 5000 },
        features: { mfaEnabled: true, auditLogging: true, emailNotifications: false },
      },
      update: {
        maintenanceMode: true,
        defaultPlan: 'PRO',
        maxTenantsPerPlan: { FREE: 10, STARTER: 100, PRO: 750, ENTERPRISE: 5000 },
        features: { mfaEnabled: true, auditLogging: true, emailNotifications: false },
      },
    });
    expect(result.defaultPlan).toBe('PRO');
    expect(auditService.logEvent).toHaveBeenCalledWith({
      eventType: 'SETTINGS_CHANGED',
      actor: 'SUPER_ADMIN',
      metadata: expect.objectContaining({
        next: expect.objectContaining({ maintenanceMode: true, defaultPlan: 'PRO' }),
      }),
    });
  });
});
