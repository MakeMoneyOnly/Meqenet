import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { DbOptimizationService } from './services/db-optimization.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [PrismaService, DbOptimizationService],
  exports: [PrismaService, DbOptimizationService],
})
export class PrismaModule {}