import { Module, Global } from '@nestjs/common';

import { ZodValidationPipe } from './validation.pipe';

/**
 * Global validation module for the auth service
 * Provides Zod-based validation infrastructure
 */
@Global()
@Module({
  providers: [ZodValidationPipe],
  exports: [ZodValidationPipe],
})
export class ValidationModule {}
