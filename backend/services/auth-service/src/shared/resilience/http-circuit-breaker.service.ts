import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { CircuitBreakerService, CircuitBreakerConfig } from './circuit-breaker.service';

@Injectable()
export class HttpCircuitBreakerService {
  private readonly logger = new Logger(HttpCircuitBreakerService.name);
  private readonly axiosInstance = axios.create();

  constructor(private readonly circuitBreaker: CircuitBreakerService) {
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize default circuit breakers for common services
   */
  private initializeCircuitBreakers(): void {
    // Circuit breaker for external payment services
    this.circuitBreaker.registerCircuit({
      name: 'payment-service',
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      successThreshold: 3,
    });

    // Circuit breaker for external KYC services
    this.circuitBreaker.registerCircuit({
      name: 'kyc-service',
      failureThreshold: 3,
      recoveryTimeout: 120000, // 2 minutes
      monitoringPeriod: 600000, // 10 minutes
      successThreshold: 2,
    });

    // Circuit breaker for external notification services
    this.circuitBreaker.registerCircuit({
      name: 'notification-service',
      failureThreshold: 10,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 180000, // 3 minutes
      successThreshold: 5,
    });

    // Circuit breaker for external analytics services
    this.circuitBreaker.registerCircuit({
      name: 'analytics-service',
      failureThreshold: 15,
      recoveryTimeout: 45000, // 45 seconds
      monitoringPeriod: 300000, // 5 minutes
      successThreshold: 8,
    });

    this.logger.log('HTTP Circuit breakers initialized');
  }

  /**
   * Make HTTP request with circuit breaker protection
   */
  async request<T = any>(
    circuitName: string,
    config: AxiosRequestConfig,
    fallback?: () => Promise<T>,
  ): Promise<AxiosResponse<T>> {
    return this.circuitBreaker.execute(
      circuitName,
      async () => {
        this.logger.debug(`Making HTTP request to ${config.url} via circuit ${circuitName}`);
        return this.axiosInstance.request<T>(config);
      },
      async () => {
        if (fallback) {
          this.logger.warn(`Circuit ${circuitName} is open, using fallback`);
          // Convert fallback result to AxiosResponse format
          const fallbackResult = await fallback();
          return {
            data: fallbackResult,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse<T>;
        }
        throw new Error(`Circuit breaker ${circuitName} is open and no fallback provided`);
      },
    );
  }

  /**
   * GET request with circuit breaker
   */
  async get<T = any>(
    circuitName: string,
    url: string,
    config?: AxiosRequestConfig,
    fallback?: () => Promise<T>,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      circuitName,
      { ...config, method: 'GET', url },
      fallback,
    );
  }

  /**
   * POST request with circuit breaker
   */
  async post<T = any>(
    circuitName: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    fallback?: () => Promise<T>,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      circuitName,
      { ...config, method: 'POST', url, data },
      fallback,
    );
  }

  /**
   * PUT request with circuit breaker
   */
  async put<T = any>(
    circuitName: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    fallback?: () => Promise<T>,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      circuitName,
      { ...config, method: 'PUT', url, data },
      fallback,
    );
  }

  /**
   * DELETE request with circuit breaker
   */
  async delete<T = any>(
    circuitName: string,
    url: string,
    config?: AxiosRequestConfig,
    fallback?: () => Promise<T>,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      circuitName,
      { ...config, method: 'DELETE', url },
      fallback,
    );
  }

  /**
   * Register a custom circuit breaker for HTTP calls
   */
  registerHttpCircuit(config: CircuitBreakerConfig): void {
    this.circuitBreaker.registerCircuit(config);
    this.logger.log(`HTTP Circuit breaker ${config.name} registered`);
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitStats(circuitName: string) {
    return this.circuitBreaker.getStats(circuitName);
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllCircuitStats() {
    return this.circuitBreaker.getAllStats();
  }

  /**
   * Manually reset a circuit breaker
   */
  resetCircuit(circuitName: string): boolean {
    return this.circuitBreaker.reset(circuitName);
  }

  /**
   * Manually open a circuit breaker
   */
  openCircuit(circuitName: string): boolean {
    return this.circuitBreaker.open(circuitName);
  }

  /**
   * Create a fallback function for payment operations
   */
  createPaymentFallback(operation: string) {
    return async () => {
      this.logger.warn(`Payment operation ${operation} failed, using fallback`);

      // For payment operations, we might want to:
      // 1. Queue the operation for later retry
      // 2. Use a cached response if available
      // 3. Return a pending status

      return {
        status: 'PENDING',
        operation,
        fallback: true,
        timestamp: new Date().toISOString(),
        message: 'Payment service unavailable, operation queued for retry',
      };
    };
  }

  /**
   * Create a fallback function for notification operations
   */
  createNotificationFallback(operation: string) {
    return async () => {
      this.logger.warn(`Notification operation ${operation} failed, using fallback`);

      // For notifications, we might want to:
      // 1. Store the notification in a local queue
      // 2. Send a simplified version
      // 3. Mark as pending

      return {
        status: 'QUEUED',
        operation,
        fallback: true,
        timestamp: new Date().toISOString(),
        message: 'Notification service unavailable, queued for retry',
      };
    };
  }

  /**
   * Create a fallback function for analytics operations
   */
  createAnalyticsFallback(operation: string) {
    return async () => {
      this.logger.warn(`Analytics operation ${operation} failed, using fallback`);

      // For analytics, we can often skip or batch operations
      return {
        status: 'SKIPPED',
        operation,
        fallback: true,
        timestamp: new Date().toISOString(),
        message: 'Analytics service unavailable, operation skipped',
      };
    };
  }
}
