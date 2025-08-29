import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

export interface OpenTelemetryConfig {
  nodeEnv?: string;
  serviceName?: string;
  jaegerEndpoint?: string;
}

export function initializeOpenTelemetry(config?: OpenTelemetryConfig): void {
  try {
    if (sdk) return; // already initialized

    // Use provided config or defaults (no direct environment variable access)
    const nodeEnv = config?.nodeEnv ?? 'development';
    const serviceName = config?.serviceName ?? 'auth-service';
    const _jaegerEndpoint =
      config?.jaegerEndpoint ?? 'http://localhost:14268/api/traces';

    // Be quiet in prod; verbose in non-prod
    const level =
      nodeEnv === 'production' ? DiagLogLevel.ERROR : DiagLogLevel.INFO;
    diag.setLogger(new DiagConsoleLogger(), level);

    // Initialize SDK with basic configuration (simplified to avoid version conflicts)
    sdk = new NodeSDK({
      instrumentations: [getNodeAutoInstrumentations()],
      serviceName,
    });

    void sdk.start();
  } catch {
    // Ignore OpenTelemetry initialization errors to avoid service startup failures
  }
}

export async function shutdownOpenTelemetry(): Promise<void> {
  try {
    if (!sdk) return;
    await sdk.shutdown();
  } catch {
    // ignore
  }
}
