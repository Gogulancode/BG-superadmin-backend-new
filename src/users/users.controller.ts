import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserQueryDto } from './dto/user-query.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get cross-tenant user stats' })
  @ApiOkResponse({ description: 'Cross-tenant user summary' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'List cross-tenant users' })
  @ApiOkResponse({ description: 'Paginated cross-tenant users' })
  listUsers(@Query() query: UserQueryDto) {
    return this.usersService.listUsers(query);
  }
}
