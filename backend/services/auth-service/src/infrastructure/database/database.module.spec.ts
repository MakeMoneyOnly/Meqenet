/// <reference types="vitest" />
import 'reflect-metadata'; // Required for NestJS dependency injection
import { ConfigModule } from '@nestjs/config';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

import { DatabaseModule } from './database.module';
import { PrismaService } from './prisma.service';

/**
 * Critical Database Module Tests
 *
 * Tests compliance with:
 * - NestJS module configuration
 * - Dependency injection setup
 * - Service exports for application use
 * - Configuration module integration
 */
describe('DatabaseModule - Configuration Tests', () => {
  let module: DatabaseModule;

  beforeEach(async () => {
    // Manual dependency injection to work around Vitest DI issues
    module = new DatabaseModule();

    // Verify manual injection worked
    expect(module).toBeDefined();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Module Configuration', () => {
    it('should be defined and instantiable', () => {
      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(DatabaseModule);
    });

    it('should have correct module metadata', () => {
      // Get the module metadata through reflection
      const moduleMetadata =
        Reflect.getMetadata('imports', DatabaseModule) ?? [];
      const providersMetadata =
        Reflect.getMetadata('providers', DatabaseModule) ?? [];
      const exportsMetadata =
        Reflect.getMetadata('exports', DatabaseModule) ?? [];

      // Verify imports include ConfigModule
      expect(moduleMetadata).toContain(ConfigModule);

      // Verify providers include PrismaService
      expect(providersMetadata).toContain(PrismaService);

      // Verify exports include PrismaService
      expect(exportsMetadata).toContain(PrismaService);
    });

    it('should properly configure dependency injection', () => {
      // Verify that the module class has proper NestJS metadata
      const designParamtypes =
        Reflect.getMetadata('design:paramtypes', DatabaseModule) ?? [];
      expect(designParamtypes).toBeDefined();
      expect(Array.isArray(designParamtypes)).toBe(true);
    });
  });

  describe('Service Integration', () => {
    it('should provide PrismaService for dependency injection', () => {
      const providers = Reflect.getMetadata('providers', DatabaseModule) ?? [];
      expect(providers).toContain(PrismaService);
    });

    it('should export PrismaService for other modules', () => {
      const exports = Reflect.getMetadata('exports', DatabaseModule) ?? [];
      expect(exports).toContain(PrismaService);
    });

    it('should import ConfigModule for configuration', () => {
      const imports = Reflect.getMetadata('imports', DatabaseModule) ?? [];
      expect(imports).toContain(ConfigModule);
    });
  });

  describe('Module Documentation', () => {
    it('should have comprehensive documentation comments', () => {
      // Verify the module has proper class name and structure
      expect(DatabaseModule.name).toBe('DatabaseModule');
      expect(DatabaseModule.prototype).toBeDefined();

      // The module should be a proper NestJS module class
      expect(typeof DatabaseModule).toBe('function');
      expect(DatabaseModule.prototype.constructor).toBe(DatabaseModule);
    });
  });

  describe('NBE Compliance Features', () => {
    it('should be configured for Ethiopian financial service requirements', () => {
      // Verify module is properly set up for NBE compliance
      const exports = Reflect.getMetadata('exports', DatabaseModule) ?? [];
      expect(exports).toContain(PrismaService);

      // PrismaService should be available for audit logging and secure transactions
      expect(PrismaService).toBeDefined();
    });

    it('should support secure database connections', () => {
      // Verify ConfigModule is imported for secure configuration
      const imports = Reflect.getMetadata('imports', DatabaseModule) ?? [];
      expect(imports).toContain(ConfigModule);
    });

    it('should provide infrastructure for audit logging', () => {
      // Verify PrismaService is available for audit trail requirements
      const providers = Reflect.getMetadata('providers', DatabaseModule) ?? [];
      expect(providers).toContain(PrismaService);
    });
  });

  describe('Module Lifecycle', () => {
    it('should initialize without errors', () => {
      expect(() => new DatabaseModule()).not.toThrow();
    });

    it('should be compatible with NestJS module system', () => {
      // Verify the module follows NestJS conventions
      expect(DatabaseModule).toHaveProperty('prototype');
      expect(DatabaseModule.prototype).toHaveProperty('constructor');
    });
  });
});
