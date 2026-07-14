import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { Template } from '../common/database/entities/template.entity';
import { EmbeddingsModule } from '../common/embeddings/embeddings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template]),
    EmbeddingsModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
