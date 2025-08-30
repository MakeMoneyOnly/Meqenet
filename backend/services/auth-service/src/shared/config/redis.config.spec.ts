import { vi, describe, it, expect, beforeEach } from 'vitest';

import { RedisConfigService } from './redis.config';

describe('RedisConfigService', () => {
  let service: RedisConfigService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: vi.fn(),
    };

    service = new RedisConfigService(mockConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('host', () => {
    it('should return configured host', () => {
      mockConfigService.get.mockReturnValue('redis-server');

      expect(service.host).toBe('redis-server');
      expect(mockConfigService.get).toHaveBeenCalledWith('redisHost', {
        infer: true,
      });
    });

    it('should return default host when not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.host).toBe('localhost');
    });
  });

  describe('port', () => {
    it('should return configured port', () => {
      mockConfigService.get.mockReturnValue('6380');

      expect(service.port).toBe(6380);
      expect(mockConfigService.get).toHaveBeenCalledWith('redisPort', {
        infer: true,
      });
    });

    it('should return default port when not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.port).toBe(6379);
    });
  });

  describe('connection', () => {
    it('should return connection object', () => {
      mockConfigService.get.mockReturnValueOnce('redis-server');
      mockConfigService.get.mockReturnValueOnce('6380');

      expect(service.connection).toEqual({
        host: 'redis-server',
        port: 6380,
      });
    });
  });
});
