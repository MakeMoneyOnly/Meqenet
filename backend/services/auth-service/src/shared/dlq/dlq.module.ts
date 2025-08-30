import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DLQService } from './dlq.service';
import { DLQController } from './dlq.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DLQController],
  providers: [DLQService],
  exports: [DLQService],
})
export class DLQModule {}
