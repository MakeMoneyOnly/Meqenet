import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as jose from 'jose';

@Injectable()
export class JwksService implements OnModuleInit {
  private privateKey!: jose.KeyLike;
  private publicKey!: jose.KeyLike;
  private jwks!: { keys: jose.JWK[] };
  private readonly logger = new Logger(JwksService.name);

  async onModuleInit(): Promise<void> {
    // TODO: In production, load the private key from a secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)
    // For now, we generate a new key pair on startup for development purposes.
    this.logger.warn(
      'Generating new in-memory key pair for JWT signing. This is not suitable for production.'
    );
    const { privateKey, publicKey } = await jose.generateKeyPair('RS256');
    this.privateKey = privateKey;
    this.publicKey = publicKey;

    const jwk = await jose.exportJWK(this.publicKey);
    this.jwks = {
      keys: [
        {
          ...jwk,
          kid: 'meqenet-signing-key',
          alg: 'RS256',
          use: 'sig',
        },
      ],
    };
  }

  getJwks(): { keys: jose.JWK[] } {
    return this.jwks;
  }

  getPrivateKey(): jose.KeyLike {
    return this.privateKey;
  }

  getPublicKey(): jose.KeyLike {
    return this.publicKey;
  }

  getKid(): string {
    return 'meqenet-signing-key';
  }
}
