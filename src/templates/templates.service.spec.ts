import { Test } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: { globalTemplate: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; count: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      globalTemplate: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TemplatesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(TemplatesService);
  });

  it('lists templates with filters', async () => {
    prisma.globalTemplate.findMany.mockResolvedValue([]);
    prisma.globalTemplate.count.mockResolvedValue(0);
    await service.listTemplates({ type: undefined, isActive: true, page: 1, pageSize: 20 });
    expect(prisma.globalTemplate.findMany).toHaveBeenCalledWith({
      where: { type: undefined, isActive: true },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(prisma.globalTemplate.count).toHaveBeenCalledWith({ where: { type: undefined, isActive: true } });
  });

  it('keeps the legacy array shape when pagination is not requested', async () => {
    prisma.globalTemplate.findMany.mockResolvedValue([]);

    const result = await service.listTemplates({ type: undefined, isActive: true });

    expect(result).toEqual([]);
    expect(prisma.globalTemplate.count).not.toHaveBeenCalled();
  });

  it('creates templates from web UI payloads', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    prisma.globalTemplate.create.mockResolvedValue({
      id: 'template_1',
      type: 'METRIC',
      name: 'Weekly Revenue',
      description: 'Track revenue',
      payload: { category: 'Revenue', metricSchema: [{ name: 'Revenue', type: 'currency' }] },
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    });

    const result = await service.createTemplate({
      name: 'Weekly Revenue',
      description: 'Track revenue',
      category: 'Revenue',
      metricSchema: [{ name: 'Revenue', type: 'currency' }],
    });

    expect(prisma.globalTemplate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'METRIC',
        name: 'Weekly Revenue',
        payload: expect.objectContaining({ category: 'Revenue' }),
      }),
    });
    expect(result).toMatchObject({
      type: 'METRIC',
      scope: 'GLOBAL',
      status: 'ACTIVE',
      category: 'Revenue',
    });
  });

  it('throws when template missing', async () => {
    prisma.globalTemplate.findUnique.mockResolvedValue(null);
    await expect(service.getTemplate('missing')).rejects.toThrow('Template not found');
  });
});
