import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateQueryDto } from './dto/template-query.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateType } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async listTemplates(filters: TemplateQueryDto) {
    const isActive = filters.isActive ?? this.statusToActive(filters.status);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: any = {
      type: filters.type,
      isActive,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (!filters.page && !filters.pageSize) {
      const templates = await this.prisma.globalTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return templates.map((template) => this.toResponse(template));
    }

    const [data, total] = await Promise.all([
      this.prisma.globalTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.globalTemplate.count({ where }),
    ]);

    return {
      data: data.map((template) => this.toResponse(template)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTemplate(id: string) {
    const template = await this.findRawTemplate(id);
    return this.toResponse(template);
  }

  createTemplate(dto: CreateTemplateDto) {
    return this.prisma.globalTemplate
      .create({ data: this.toCreateData(dto) })
      .then((template) => this.toResponse(template));
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    await this.getTemplate(id);
    return this.prisma.globalTemplate
      .update({ where: { id }, data: this.toUpdateData(dto) })
      .then((template) => this.toResponse(template));
  }

  async duplicateTemplate(id: string) {
    const template = await this.findRawTemplate(id);
    const duplicated = await this.prisma.globalTemplate.create({
      data: {
        type: template.type,
        name: `${template.name} (Copy)`,
        description: template.description,
        payload: template.payload as any,
        isActive: true,
      },
    });
    return this.toResponse(duplicated);
  }

  async softDelete(id: string) {
    await this.getTemplate(id);
    const template = await this.prisma.globalTemplate.update({ where: { id }, data: { isActive: false } });
    return this.toResponse(template);
  }

  private toCreateData(dto: CreateTemplateDto) {
    const payload = this.toPayload(dto);
    return {
      type: dto.type ?? this.inferType(dto.category),
      name: dto.name,
      description: dto.description,
      payload,
      isActive: dto.isActive ?? this.statusToActive(dto.status) ?? true,
    };
  }

  private async findRawTemplate(id: string) {
    const template = await this.prisma.globalTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  private toUpdateData(dto: UpdateTemplateDto) {
    const data: any = {
      name: dto.name,
      description: dto.description,
    };
    const payload = this.toPayload(dto);
    if (Object.keys(payload).length > 0) {
      data.payload = payload;
    }
    const active = dto.isActive ?? this.statusToActive(dto.status);
    if (active !== undefined) {
      data.isActive = active;
    }
    return data;
  }

  private toPayload(dto: Partial<CreateTemplateDto & UpdateTemplateDto>) {
    return {
      ...(dto.payload ?? {}),
      ...(dto.scope !== undefined ? { scope: dto.scope } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
      ...(dto.targetValue !== undefined ? { targetValue: dto.targetValue } : {}),
      ...(dto.metricSchema !== undefined ? { metricSchema: dto.metricSchema } : {}),
    };
  }

  private toResponse(template: any) {
    const payload = typeof template.payload === 'object' && template.payload !== null
      ? template.payload as Record<string, any>
      : {};
    return {
      ...template,
      type: template.type,
      scope: payload.scope ?? 'GLOBAL',
      status: template.isActive ? 'ACTIVE' : 'INACTIVE',
      category: payload.category ?? null,
      frequency: payload.frequency ?? null,
      targetValue: payload.targetValue ?? null,
      metricSchema: Array.isArray(payload.metricSchema) ? payload.metricSchema : [],
      usedByTenantsCount: payload.usedByTenantsCount ?? 0,
    };
  }

  private statusToActive(status?: string) {
    if (!status) return undefined;
    return status.toUpperCase() === 'ACTIVE';
  }

  private inferType(category?: string) {
    const value = category?.toUpperCase();
    if (value?.includes('OUTCOME')) return TemplateType.OUTCOME;
    if (value?.includes('ACTIVITY')) return TemplateType.ACTIVITY;
    return TemplateType.METRIC;
  }
}
