import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SupportQueryDto } from './dto/support-query.dto';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportStatusDto } from './dto/update-support-status.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { SupportTicketDto } from './dto/support-ticket.dto';

@ApiTags('Support')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'List support tickets' })
  @ApiOkResponse({ type: SupportTicketDto, isArray: true })
  listTickets(@Query() query: SupportQueryDto) {
    return this.supportService.listTickets(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get support ticket details' })
  @ApiOkResponse({ type: SupportTicketDto })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  getTicket(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a support ticket for a tenant' })
  @ApiCreatedResponse({ type: SupportTicketDto })
  createTicket(@Body() dto: CreateSupportTicketDto) {
    return this.supportService.createTicket(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update support ticket status' })
  @ApiOkResponse({ type: SupportTicketDto })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSupportStatusDto) {
    return this.supportService.updateStatus(id, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign agent to support ticket' })
  @ApiOkResponse({ type: SupportTicketDto })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  assignAgent(@Param('id') id: string, @Body() dto: AssignAgentDto) {
    return this.supportService.assignAgent(id, dto);
  }
}
