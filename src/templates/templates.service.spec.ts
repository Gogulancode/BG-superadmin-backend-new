import { Test } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: { globalTemplate: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      globalTemplate: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TemplatesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(TemplatesService);
  });

  it('lists templates with filters', async () => {
    prisma.globalTemplate.findMany.mockResolvedValue([]);
    await service.listTemplates({ type: undefined, isActive: true });
    expect(prisma.globalTemplate.findMany).toHaveBeenCalledWith({
      where: { type: undefined, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('throws when template missing', async () => {
    prisma.globalTemplate.findUnique.mockResolvedValue(null);
    await expect(service.getTemplate('missing')).rejects.toThrow('Template not found');
  });
});
