import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AssignAgentDto {
  @ApiProperty({ description: 'Agent name or ID to assign', example: 'support-agent-1' })
  @IsString()
  @MinLength(1)
  assignedTo: string;
}
