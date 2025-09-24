import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VirtualCardsService } from './services/virtual-cards.service';
import { VirtualCardsController } from './controllers/virtual-cards.controller';

@Module({
  imports: [PrismaModule],
  controllers: [VirtualCardsController],
  providers: [VirtualCardsService],
  exports: [VirtualCardsService],
})
export class VirtualCardsModule {}
