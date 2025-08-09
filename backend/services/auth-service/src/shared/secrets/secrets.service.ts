import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsService {
  private readonly client: SecretsManagerClient;

  constructor(private readonly configService: ConfigService) {
    this.client = new SecretsManagerClient({
      region: this.configService.get<string>('AWS_REGION') ?? 'us-east-1',
    });
  }

  async getSecretString(secretId: string): Promise<string> {
    const resp = await this.client.send(
      new GetSecretValueCommand({ SecretId: secretId })
    );
    if (!resp.SecretString) {
      throw new Error(`Secret ${secretId} has no SecretString`);
    }
    return resp.SecretString;
  }

  async getJson<T = Record<string, unknown>>(secretId: string): Promise<T> {
    const value = await this.getSecretString(secretId);
    return JSON.parse(value) as T;
  }
}
