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

    // Be quiet in prod; verbose in non-prod
    const level =
      nodeEnv === 'production' ? DiagLogLevel.ERROR : DiagLogLevel.INFO;
    diag.setLogger(new DiagConsoleLogger(), level);

    // Initialize SDK with basic configuration
    // In production, configure proper exporters via env vars
    sdk = new NodeSDK({
      instrumentations: [getNodeAutoInstrumentations()],
      serviceName,
    });

    void sdk.start();
  } catch {
    // Do not fail service due to APM init
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
