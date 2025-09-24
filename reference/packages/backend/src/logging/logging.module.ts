import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingService } from './services/logging.service';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';
import { ErrorLoggingInterceptor } from './interceptors/error-logging.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggingService,
    RequestLoggingInterceptor,
    ErrorLoggingInterceptor,
  ],
  exports: [
    LoggingService,
    RequestLoggingInterceptor,
    ErrorLoggingInterceptor,
  ],
})
export class LoggingModule {}
