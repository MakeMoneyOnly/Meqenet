import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from '@prisma/client';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  @OnEvent('user.phone.changed')
  async handleUserPhoneChangedEvent(payload: {
    user: User;
    oldPhone: string | null;
  }): Promise<void> {
    const { user, oldPhone } = payload;
    const message = `Your phone number has been changed from ${oldPhone || 'N/A'} to ${user.phone}. If you did not authorize this change, please contact support immediately.`;

    // Log to console for demonstration purposes
    this.logger.log(
      `Sending phone number change notice to email: ${user.email}`
    );
    this.logger.log(`Message: ${message}`);

    // In a real application, you would integrate with email/SMS services here
  }
}
