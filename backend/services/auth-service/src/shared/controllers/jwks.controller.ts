import { Controller, Get, Header, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import {
  SecretManagerService,
  JWKSResponse,
} from '../services/secret-manager.service';

@ApiTags('JWKS')
@Controller('jwks')
export class JWKSController {
  private readonly logger = new Logger(JWKSController.name);

  constructor(private readonly secretManagerService: SecretManagerService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Get JSON Web Key Set',
    description: 'Returns the public keys used for JWT token verification',
  })
  @ApiResponse({
    status: 200,
    description: 'JWKS successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kty: { type: 'string', example: 'RSA' },
              use: { type: 'string', example: 'sig' },
              kid: { type: 'string', example: 'meqenet-jwt-abc123' },
              n: { type: 'string', description: 'RSA modulus' },
              e: {
                type: 'string',
                example: 'AQAB',
                description: 'RSA exponent',
              },
              alg: { type: 'string', example: 'RS256' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getJWKS(): Promise<JWKSResponse> {
    try {
      this.logger.log('📥 JWKS endpoint accessed');

      const jwks = await this.secretManagerService.getJWKS();

      this.logger.log(`✅ JWKS returned with ${jwks.keys.length} key(s)`);

      return jwks;
    } catch (error) {
      this.logger.error('❌ Failed to retrieve JWKS:', error);
      throw error;
    }
  }

  @Get('.well-known/jwks.json')
  @Header('Cache-Control', 'public, max-age=3600')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Get JSON Web Key Set (RFC 8414 compliant)',
    description:
      'Returns the public keys used for JWT token verification (RFC 8414 compliant endpoint)',
  })
  @ApiResponse({
    status: 200,
    description: 'JWKS successfully retrieved',
  })
  async getJWKSWellKnown(): Promise<JWKSResponse> {
    return this.getJWKS();
  }
}
