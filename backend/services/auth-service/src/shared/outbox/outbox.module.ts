import { Module } from '@nestjs/common';

import { MessagingModule } from '../../infrastructure/messaging/messaging.module';
import { PrismaModule } from '../prisma/prisma.module';

import { OutboxService } from './outbox.service';

@Module({
  imports: [PrismaModule, MessagingModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
