import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { DLQController } from './dlq.controller';
import { DLQService } from './dlq.service';

@Module({
  imports: [PrismaModule],
  controllers: [DLQController],
  providers: [DLQService],
  exports: [DLQService],
})
export class DLQModule {}
