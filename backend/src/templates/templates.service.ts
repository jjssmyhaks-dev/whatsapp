import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Template } from '../common/database/entities/template.entity';
import { EmbeddingsService } from '../common/embeddings/embeddings.service';

// DTOs
interface CreateTemplateDto {
  name: string;
  triggerIntent: string;
  replyText: string;
  active?: boolean;
  isUrgentAcknowledgement?: boolean;
  responseType?: 'text' | 'template' | 'interactive';
  metadata?: Record<string, any>;
  priority?: number;
}

interface UpdateTemplateDto extends Partial<CreateTemplateDto> {
  id: string;
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
    private embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Creates a new template
   */
  async createTemplate(
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<Template> {
    try {
      // Generate embedding for the trigger intent
      let triggerEmbedding: string | null = null;
      
      if (dto.triggerIntent) {
        const embedding = await this.embeddingsService.generateEmbedding(dto.triggerIntent);
        triggerEmbedding = JSON.stringify(embedding);
      }

      const template = this.templateRepo.create({
        userId,
        name: dto.name,
        triggerIntent: dto.triggerIntent,
        triggerEmbedding,
        replyText: dto.replyText,
        active: dto.active !== undefined ? dto.active : true,
        isUrgentAcknowledgement: dto.isUrgentAcknowledgement || false,
        responseType: dto.responseType || 'text',
        metadata: dto.metadata || {},
        priority: dto.priority || 0,
      });

      await this.templateRepo.save(template);

      this.logger.log({
        message: 'Template created',
        templateId: template.id,
        userId,
        name: template.name,
      });

      return template;
    } catch (error) {
      this.logger.error({
        message: 'Failed to create template',
        error: error.message,
        stack: error.stack,
        userId,
        dto,
      });
      throw error;
    }
  }

  /**
   * Updates a template
   */
  async updateTemplate(
    userId: string,
    dto: UpdateTemplateDto,
  ): Promise<Template> {
    try {
      const template = await this.templateRepo.findOne({
        where: { id: dto.id, userId },
      });

      if (!template) {
        throw new Error(`Template not found: ${dto.id}`);
      }

      // Update fields
      if (dto.name !== undefined) template.name = dto.name;
      if (dto.triggerIntent !== undefined) template.triggerIntent = dto.triggerIntent;
      if (dto.replyText !== undefined) template.replyText = dto.replyText;
      if (dto.active !== undefined) template.active = dto.active;
      if (dto.isUrgentAcknowledgement !== undefined) {
        template.isUrgentAcknowledgement = dto.isUrgentAcknowledgement;
      }
      if (dto.responseType !== undefined) template.responseType = dto.responseType;
      if (dto.metadata !== undefined) template.metadata = dto.metadata;
      if (dto.priority !== undefined) template.priority = dto.priority;

      // Regenerate embedding if trigger intent changed
      if (dto.triggerIntent !== undefined) {
        const embedding = await this.embeddingsService.generateEmbedding(dto.triggerIntent);
        template.triggerEmbedding = JSON.stringify(embedding);
      }

      template.updatedAt = new Date();

      await this.templateRepo.save(template);

      this.logger.log({
        message: 'Template updated',
        templateId: template.id,
        userId,
      });

      return template;
    } catch (error) {
      this.logger.error({
        message: 'Failed to update template',
        error: error.message,
        stack: error.stack,
        userId,
        templateId: dto.id,
      });
      throw error;
    }
  }

  /**
   * Gets a template by ID
   */
  async getTemplate(userId: string, templateId: string): Promise<Template | null> {
    try {
      return this.templateRepo.findOne({
        where: { id: templateId, userId },
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to get template',
        error: error.message,
        userId,
        templateId,
      });
      throw error;
    }
  }

  /**
   * Lists templates for a user
   */
  async listTemplates(
    userId: string,
    options: FindManyOptions<Template> = {},
  ): Promise<{ templates: Template[]; total: number }> {
    try {
      const query: FindManyOptions<Template> = {
        where: { userId, ...options.where },
        order: options.order || { priority: 'DESC', createdAt: 'DESC' },
        take: options.take || 100,
        skip: options.skip || 0,
      };

      const [templates, total] = await this.templateRepo.findAndCount(query);

      return { templates, total };
    } catch (error) {
      this.logger.error({
        message: 'Failed to list templates',
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Deletes a template
   */
  async deleteTemplate(userId: string, templateId: string): Promise<boolean> {
    try {
      const result = await this.templateRepo.delete({
        id: templateId,
        userId,
      });

      if (result.affected && result.affected > 0) {
        this.logger.log({
          message: 'Template deleted',
          templateId,
          userId,
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error({
        message: 'Failed to delete template',
        error: error.message,
        userId,
        templateId,
      });
      throw error;
    }
  }

  /**
   * Toggles template active status
   */
  async toggleTemplate(userId: string, templateId: string): Promise<Template> {
    try {
      const template = await this.templateRepo.findOne({
        where: { id: templateId, userId },
      });

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      template.active = !template.active;
      template.updatedAt = new Date();

      await this.templateRepo.save(template);

      this.logger.log({
        message: 'Template toggled',
        templateId,
        userId,
        active: template.active,
      });

      return template;
    } catch (error) {
      this.logger.error({
        message: 'Failed to toggle template',
        error: error.message,
        userId,
        templateId,
      });
      throw error;
    }
  }

  /**
   * Gets templates by trigger intent
   */
  async getTemplatesByIntent(
    userId: string,
    intent: string,
  ): Promise<Template[]> {
    try {
      return this.templateRepo.find({
        where: { userId, triggerIntent: intent, active: true },
        order: { priority: 'DESC' },
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to get templates by intent',
        error: error.message,
        userId,
        intent,
      });
      throw error;
    }
  }

  /**
   * Searches templates by name or intent
   */
  async searchTemplates(
    userId: string,
    query: string,
    limit: number = 20,
  ): Promise<Template[]> {
    try {
      return this.templateRepo
        .createQueryBuilder('template')
        .where('template.userId = :userId', { userId })
        .andWhere(
          '(template.name ILIKE :query OR template.triggerIntent ILIKE :query OR template.replyText ILIKE :query)',
          { query: `%${query}%` },
        )
        .orderBy('template.priority', 'DESC')
        .addOrderBy('template.createdAt', 'DESC')
        .take(limit)
        .getMany();
    } catch (error) {
      this.logger.error({
        message: 'Failed to search templates',
        error: error.message,
        userId,
        query,
      });
      throw error;
    }
  }

  /**
   * Gets the most used templates for a user
   */
  async getMostUsedTemplates(userId: string, limit: number = 10): Promise<Template[]> {
    try {
      return this.templateRepo.find({
        where: { userId },
        order: { usageCount: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to get most used templates',
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Updates template usage statistics
   */
  async updateTemplateUsage(templateId: string, userId: string): Promise<void> {
    try {
      await this.templateRepo.update(
        { id: templateId, userId },
        {
          usageCount: () => 'usageCount + 1',
          lastUsedAt: new Date(),
        },
      );
    } catch (error) {
      this.logger.error({
        message: 'Failed to update template usage',
        error: error.message,
        templateId,
        userId,
      });
    }
  }

  /**
   * Regenerates embeddings for all templates (for a user or all users)
   */
  async regenerateEmbeddings(userId?: string): Promise<number> {
    try {
      const query: any = {};
      if (userId) {
        query.userId = userId;
      }

      const templates = await this.templateRepo.find({
        where: query,
      });

      let count = 0;
      for (const template of templates) {
        if (template.triggerIntent) {
          const embedding = await this.embeddingsService.generateEmbedding(
            template.triggerIntent,
          );
          template.triggerEmbedding = JSON.stringify(embedding);
          await this.templateRepo.save(template);
          count++;
        }
      }

      this.logger.log({
        message: 'Embeddings regenerated',
        count,
        userId: userId || 'all',
      });

      return count;
    } catch (error) {
      this.logger.error({
        message: 'Failed to regenerate embeddings',
        error: error.message,
        stack: error.stack,
        userId,
      });
      throw error;
    }
  }
}
