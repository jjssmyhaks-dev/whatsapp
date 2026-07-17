import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TriageService } from '../triage/triage.service';
import { ThreadsService } from '../threads/threads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('stats')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(
    private triageService: TriageService,
    private threadsService: ThreadsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard stats' })
  async dashboard(@User() user: UserEntity) {
    return this.threadsService.getStats(user.id);
  }

  @Get('fast-path')
  @ApiOperation({ summary: 'Get fast-path stats' })
  async fastPath(@User() user: UserEntity) {
    return this.triageService.getFastPathStats(user.id);
  }
}
