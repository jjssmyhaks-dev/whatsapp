import { Module } from '@nestjs/common';
import { EncryptionModule } from './encryption/encryption.module';
import { MistralModule } from './mistral/mistral.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [EncryptionModule, MistralModule, EmbeddingsModule, DatabaseModule],
  exports: [EncryptionModule, MistralModule, EmbeddingsModule, DatabaseModule],
})
export class CommonModule {}
