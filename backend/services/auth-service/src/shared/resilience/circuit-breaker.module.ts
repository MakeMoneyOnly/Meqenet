import { Module } from '@nestjs/common';

import { CircuitBreakerService } from './circuit-breaker.service';
import { HttpCircuitBreakerService } from './http-circuit-breaker.service';

@Module({
  providers: [CircuitBreakerService, HttpCircuitBreakerService],
  exports: [CircuitBreakerService, HttpCircuitBreakerService],
})
export class CircuitBreakerModule {}
