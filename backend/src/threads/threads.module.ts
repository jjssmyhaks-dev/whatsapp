import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';
import { Thread } from '../common/database/entities/thread.entity';
import { Message } from '../common/database/entities/message.entity';
import { Contact } from '../common/database/entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Thread, Message, Contact]),
  ],
  controllers: [ThreadsController],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class ThreadsModule {}
