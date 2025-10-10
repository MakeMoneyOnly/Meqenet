/**
 * Testing Utilities Barrel Export
 *
 * Centralized exports for all testing helper utilities.
 * Import from '@meqenet/testing' in test files.
 */

export {
  createMockPrismaClient,
  createMockService,
  createMockJwtService,
  createMockConfigService,
  createMockRequest,
  createMockResponse,
  MockBuilder,
  DateMockHelper,
  vitestMockHelpers,
  type MockPrismaClient,
  type MockJwtService,
  type MockConfigService,
  type MockExpressRequest,
  type MockExpressResponse,
} from './mock-helpers';
