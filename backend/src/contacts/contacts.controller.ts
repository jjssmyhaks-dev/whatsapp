import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contacts' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'vip', required: false })
  @ApiQuery({ name: 'search', required: false })
  async list(
    @User() user: UserEntity,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('vip') vip?: string,
    @Query('search') search?: string,
  ) {
    return this.service.list(user.id, {
      limit,
      offset,
      vip: vip === 'true' ? true : vip === 'false' ? false : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact' })
  async getOne(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.get(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: { displayName?: string; isVip?: boolean; tags?: string[] },
  ) {
    return this.service.update(user.id, id, dto);
  }
}
