import * as fs from 'fs';
import * as path from 'path';

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import pem2jwk from 'pem-to-jwk';

@Injectable()
export class JwksService implements OnModuleInit {
  private readonly logger = new Logger(JwksService.name);
  private jwks: { keys: Record<string, unknown>[] };

  onModuleInit(): void {
    this.loadJwk();
  }

  private loadJwk(): void {
    try {
      const publicKeyPath = path.join(process.cwd(), 'secrets', 'public.pem');
      const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
      const jwk = pem2jwk(publicKey);
      
      this.jwks = {
        keys: [
          {
            ...jwk,
            kid: 'meqenet-key-1', // Key ID
            alg: 'RS256',       // Algorithm
            use: 'sig',         // Signature
          },
        ],
      };

      this.logger.log('Successfully loaded public key and generated JWKS.');
    } catch (error) {
      this.logger.error('Failed to load public key or generate JWKS.', error);
      // In a real application, you might want to prevent the service from starting.
      this.jwks = { keys: [] };
    }
  }

  getJwks(): { keys: Record<string, unknown>[] } {
    return this.jwks;
  }
}
