import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Circuit data structure
interface CircuitData {
  config: CircuitBreakerConfig;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  nextAttemptTime: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time in ms before attempting recovery
  monitoringPeriod: number; // Time window in ms for failure tracking
  successThreshold: number; // Number of successes needed in half-open state
  name: string; // Circuit breaker name
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  // eslint-disable-next-line no-magic-numbers
  private readonly CLEANUP_DAYS = 30; // Days to keep old circuit data
  private circuits: Map<
    string,
    {
      config: CircuitBreakerConfig;
      state: CircuitState;
      failures: number;
      successes: number;
      lastFailureTime: Date | null;
      lastSuccessTime: Date | null;
      nextAttemptTime: Date | null;
      totalRequests: number;
      totalFailures: number;
      totalSuccesses: number;
    }
  > = new Map();

  /**
   * Register a new circuit breaker
   */
  registerCircuit(config: CircuitBreakerConfig): void {
    if (this.circuits.has(config.name)) {
      throw new Error(`Circuit breaker ${config.name} already exists`);
    }

    this.circuits.set(config.name, {
      config,
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      nextAttemptTime: null,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
    });

    this.logger.log(`Circuit breaker ${config.name} registered`);
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      throw new Error(`Circuit breaker ${circuitName} not found`);
    }

    // Check if circuit is open
    if (circuit.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(circuit)) {
        circuit.state = CircuitState.HALF_OPEN;
        circuit.successes = 0;
        this.logger.log(
          `Circuit breaker ${circuitName} entering HALF_OPEN state`
        );
      } else {
        if (fallback) {
          this.logger.warn(
            `Circuit breaker ${circuitName} is OPEN, using fallback`
          );
          return fallback();
        }
        throw new Error(`Circuit breaker ${circuitName} is OPEN`);
      }
    }

    circuit.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess(circuitName);
      return result;
    } catch (error) {
      this.onFailure(circuitName, error);
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      this.logger.error(`Circuit ${circuitName} not found`);
      return;
    }

    circuit.totalSuccesses++;
    circuit.lastSuccessTime = new Date();

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes++;
      if (circuit.successes >= circuit.config.successThreshold) {
        this.resetCircuit(circuitName);
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      circuit.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(circuitName: string, _error: unknown): void {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      this.logger.error(`Circuit ${circuitName} not found`);
      return;
    }

    circuit.totalFailures++;
    circuit.failures++;
    circuit.lastFailureTime = new Date();

    this.logger.warn(
      `Circuit breaker ${circuitName} failure: ${circuit.failures}/${circuit.config.failureThreshold}`
    );

    // Check if we should open the circuit
    if (
      circuit.state === CircuitState.CLOSED &&
      circuit.failures >= circuit.config.failureThreshold
    ) {
      this.openCircuit(circuitName);
    } else if (circuit.state === CircuitState.HALF_OPEN) {
      // If we're in half-open and get a failure, go back to open
      this.openCircuit(circuitName);
    }
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      this.logger.error(`Circuit ${circuitName} not found`);
      return;
    }
    circuit.state = CircuitState.OPEN;
    circuit.nextAttemptTime = new Date(
      Date.now() + circuit.config.recoveryTimeout
    );

    this.logger.error(`Circuit breaker ${circuitName} OPENED`);
  }

  /**
   * Reset the circuit breaker to closed state
   */
  private resetCircuit(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      this.logger.error(`Circuit ${circuitName} not found`);
      return;
    }
    circuit.state = CircuitState.CLOSED;
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.nextAttemptTime = null;

    this.logger.log(`Circuit breaker ${circuitName} RESET to CLOSED`);
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(circuit: CircuitData): boolean {
    return (
      circuit.nextAttemptTime !== null && new Date() >= circuit.nextAttemptTime
    );
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(circuitName: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) return null;

    return {
      name: circuitName,
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      lastFailureTime: circuit.lastFailureTime,
      lastSuccessTime: circuit.lastSuccessTime,
      totalRequests: circuit.totalRequests,
      totalFailures: circuit.totalFailures,
      totalSuccesses: circuit.totalSuccesses,
    };
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.circuits.entries())
      .map(([name]) => this.getStats(name))
      .filter((stats): stats is CircuitBreakerStats => stats !== null);
  }

  /**
   * Manually reset a circuit breaker
   */
  reset(circuitName: string): boolean {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) return false;

    this.resetCircuit(circuitName);
    return true;
  }

  /**
   * Manually open a circuit breaker
   */
  open(circuitName: string): boolean {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) return false;

    this.openCircuit(circuitName);
    return true;
  }

  /**
   * Clean up old circuit data (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.CLEANUP_DAYS);

      for (const [name, circuit] of this.circuits) {
        // Reset old failure data in closed circuits
        if (
          circuit.state === CircuitState.CLOSED &&
          circuit.lastFailureTime &&
          circuit.lastFailureTime < thirtyDaysAgo
        ) {
          circuit.failures = 0;
          circuit.lastFailureTime = null;
          this.logger.debug(`Cleaned old failure data for circuit ${name}`);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up old circuit data', error);
    }
  }
}
