import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TemplateQueryDto } from './dto/template-query.dto';
import { TemplateDto } from './dto/template.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@ApiTags('Templates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List global templates' })
  @ApiOkResponse({ type: TemplateDto, isArray: true })
  listTemplates(@Query() query: TemplateQueryDto) {
    return this.templatesService.listTemplates(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiCreatedResponse({ type: TemplateDto })
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template detail' })
  @ApiOkResponse({ type: TemplateDto })
  @ApiNotFoundResponse({ description: 'Template not found' })
  getTemplate(@Param('id') id: string) {
    return this.templatesService.getTemplate(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template metadata' })
  @ApiOkResponse({ type: TemplateDto })
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.updateTemplate(id, dto);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing template' })
  @ApiCreatedResponse({ type: TemplateDto })
  @ApiNotFoundResponse({ description: 'Template not found' })
  duplicateTemplate(@Param('id') id: string) {
    return this.templatesService.duplicateTemplate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate template' })
  @ApiOkResponse({ type: TemplateDto })
  deleteTemplate(@Param('id') id: string) {
    return this.templatesService.softDelete(id);
  }
}
