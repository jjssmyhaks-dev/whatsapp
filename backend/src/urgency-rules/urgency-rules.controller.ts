import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UrgencyRulesService } from './urgency-rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('urgency-rules')
@Controller('urgency-rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UrgencyRulesController {
  constructor(private readonly service: UrgencyRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List urgency rules' })
  async list(
    @User() user: UserEntity,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.service.list(user.id, { limit, offset });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rule' })
  async getOne(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.get(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a rule' })
  async create(
    @User() user: UserEntity,
    @Body() dto: {
      keywordOrPhrase: string;
      urgencyLevel: 'urgent' | 'important' | 'routine';
      matchType?: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';
      isCaseSensitive?: boolean;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    return this.service.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a rule' })
  async update(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: {
      keywordOrPhrase?: string;
      urgencyLevel?: 'urgent' | 'important' | 'routine';
      matchType?: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';
      isCaseSensitive?: boolean;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rule' })
  async delete(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle rule active status' })
  async toggle(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.toggle(user.id, id);
  }
}
