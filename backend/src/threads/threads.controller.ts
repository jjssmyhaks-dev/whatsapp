import {
  Controller, Get, Post, Put, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThreadsService } from './threads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('threads')
@Controller('threads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get thread statistics' })
  async getStats(@User() user: UserEntity) {
    return this.threadsService.getStats(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all threads' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async list(
    @User() user: UserEntity,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.threadsService.listThreads(user.id, {
      status, priority, search, limit, offset,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a thread by ID' })
  async getOne(@User() user: UserEntity, @Param('id') id: string) {
    return this.threadsService.getThread(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a thread' })
  async update(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: {
      status?: 'open' | 'closed' | 'archived' | 'waiting_human';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      assigneeId?: string | null;
    },
  ) {
    return this.threadsService.updateThread(user.id, id, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a thread' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getMessages(
    @User() user: UserEntity,
    @Param('id') threadId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.threadsService.getMessages(user.id, threadId, { limit, offset });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a thread' })
  async sendMessage(
    @User() user: UserEntity,
    @Param('id') threadId: string,
    @Body() dto: { text: string },
  ) {
    return this.threadsService.sendMessage(user.id, threadId, dto.text);
  }
}
