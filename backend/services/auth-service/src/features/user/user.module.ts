import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotificationListener } from './listeners/notification.listener';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [UserController],
  providers: [UserService, NotificationListener],
  exports: [UserService],
})
export class UserModule {}
