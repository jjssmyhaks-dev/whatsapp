import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppConnectionsService } from './whatsapp-connections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('whatsapp-connections')
@Controller('whatsapp-connections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsAppConnectionsController {
  constructor(private readonly service: WhatsAppConnectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List WhatsApp connections' })
  async list(@User() user: UserEntity) {
    return this.service.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a connection' })
  async getOne(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.get(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a connection' })
  async create(
    @User() user: UserEntity,
    @Body() dto: {
      phoneNumberId: string;
      businessPhoneNumber: string;
      accessToken: string;
      webhookVerifyToken?: string;
    },
  ) {
    return this.service.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a connection' })
  async update(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: { webhookUrl?: string; status?: 'pending' | 'active' | 'inactive' | 'error' },
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a connection' })
  async delete(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test message' })
  async test(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: { to: string; text: string },
  ) {
    return this.service.testMessage(user.id, id, dto);
  }
}
