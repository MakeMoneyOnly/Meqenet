import { Module } from '@nestjs/common';

import { OAuthController } from './oauth.controller';
import { OAuth2Service } from '../../shared/services/oauth2.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [OAuthController],
  providers: [OAuth2Service],
  exports: [OAuth2Service],
})
export class OAuthModule {}
