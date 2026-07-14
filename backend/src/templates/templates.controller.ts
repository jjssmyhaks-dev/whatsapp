import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * Create a new template
   */
  @Post()
  @ApiOperation({
    summary: 'Create a template',
    description: 'Creates a new message template for auto-replies.',
  })
  @ApiResponse({ status: 201, description: 'Template created' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async create(
    @User() user: UserEntity,
    @Body() dto: {
      name: string;
      triggerIntent: string;
      replyText: string;
      active?: boolean;
      isUrgentAcknowledgement?: boolean;
      responseType?: 'text' | 'template' | 'interactive';
      metadata?: Record<string, any>;
      priority?: number;
    },
  ) {
    return this.templatesService.createTemplate(user.id, dto);
  }

  /**
   * Get a template by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a template',
    description: 'Gets a template by its ID.',
  })
  @ApiResponse({ status: 200, description: 'Template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getOne(
    @User() user: UserEntity,
    @Param('id') id: string,
  ) {
    return this.templatesService.getTemplate(user.id, id);
  }

  /**
   * List all templates for the user
   */
  @Get()
  @ApiOperation({
    summary: 'List templates',
    description: 'Lists all templates for the authenticated user.',
  })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'isUrgentAcknowledgement', required: false, description: 'Filter by urgent acknowledgement templates' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async list(
    @User() user: UserEntity,
    @Query('active') active?: string,
    @Query('isUrgentAcknowledgement') isUrgentAcknowledgement?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const options: any = {};
    
    if (active !== undefined) {
      options.where = { ...options.where, active: active === 'true' };
    }
    
    if (isUrgentAcknowledgement !== undefined) {
      options.where = { 
        ...options.where, 
        isUrgentAcknowledgement: isUrgentAcknowledgement === 'true' 
      };
    }

    if (limit) options.take = limit;
    if (offset) options.skip = offset;

    return this.templatesService.listTemplates(user.id, options);
  }

  /**
   * Update a template
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update a template',
    description: 'Updates an existing template.',
  })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      triggerIntent?: string;
      replyText?: string;
      active?: boolean;
      isUrgentAcknowledgement?: boolean;
      responseType?: 'text' | 'template' | 'interactive';
      metadata?: Record<string, any>;
      priority?: number;
    },
  ) {
    return this.templatesService.updateTemplate(user.id, { id, ...dto });
  }

  /**
   * Delete a template
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a template',
    description: 'Deletes a template by its ID.',
  })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async delete(
    @User() user: UserEntity,
    @Param('id') id: string,
  ) {
    return this.templatesService.deleteTemplate(user.id, id);
  }

  /**
   * Toggle template active status
   */
  @Post(':id/toggle')
  @ApiOperation({
    summary: 'Toggle template active status',
    description: 'Toggles the active status of a template.',
  })
  @ApiResponse({ status: 200, description: 'Template toggled' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async toggle(
    @User() user: UserEntity,
    @Param('id') id: string,
  ) {
    return this.templatesService.toggleTemplate(user.id, id);
  }

  /**
   * Search templates
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search templates',
    description: 'Searches templates by name, intent, or reply text.',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @User() user: UserEntity,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.templatesService.searchTemplates(
      user.id,
      query,
      limit || 20,
    );
  }

  /**
   * Get most used templates
   */
  @Get('most-used')
  @ApiOperation({
    summary: 'Get most used templates',
    description: 'Gets the most frequently used templates for the user.',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiResponse({ status: 200, description: 'Most used templates' })
  async mostUsed(
    @User() user: UserEntity,
    @Query('limit') limit?: number,
  ) {
    return this.templatesService.getMostUsedTemplates(user.id, limit || 10);
  }

  /**
   * Regenerate embeddings for all templates
   */
  @Post('regenerate-embeddings')
  @ApiOperation({
    summary: 'Regenerate embeddings',
    description: 'Regenerates embeddings for all templates. Useful after model updates.',
  })
  @ApiResponse({ status: 200, description: 'Embeddings regenerated' })
  async regenerateEmbeddings(@User() user: UserEntity) {
    return this.templatesService.regenerateEmbeddings(user.id);
  }
}
