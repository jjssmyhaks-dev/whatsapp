import { Module, Global } from '@nestjs/common';
import { MistralService } from './mistral.service';

@Global()
@Module({
  providers: [MistralService],
  exports: [MistralService],
})
export class MistralModule {}
