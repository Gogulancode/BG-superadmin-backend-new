import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateQueryDto } from './dto/template-query.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  listTemplates(filters: TemplateQueryDto) {
    return this.prisma.globalTemplate.findMany({
      where: {
        type: filters.type,
        isActive: filters.isActive,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(id: string) {
    const template = await this.prisma.globalTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  createTemplate(dto: CreateTemplateDto) {
    return this.prisma.globalTemplate.create({ data: dto });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    await this.getTemplate(id);
    return this.prisma.globalTemplate.update({ where: { id }, data: dto });
  }

  async duplicateTemplate(id: string) {
    const template = await this.getTemplate(id);
    return this.prisma.globalTemplate.create({
      data: {
        type: template.type,
        name: `${template.name} (Copy)`,
        description: template.description,
        payload: template.payload as any,
        isActive: true,
      },
    });
  }

  async softDelete(id: string) {
    await this.getTemplate(id);
    return this.prisma.globalTemplate.update({ where: { id }, data: { isActive: false } });
  }
}
