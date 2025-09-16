import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: unknown): Promise<void> {
    process.on('beforeExit', async () => {
      if (app && typeof app === 'object' && 'close' in app) {
        const appWithClose = app as { close: () => Promise<void> | void };
        if (typeof appWithClose.close === 'function') {
          await Promise.resolve(appWithClose.close());
        }
      }
    });
  }
}
