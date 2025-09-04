import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

let sdk: NodeSDK | undefined;

export interface OpenTelemetryConfig {
  nodeEnv?: string;
  serviceName?: string;
  jaegerEndpoint?: string;
  otelEndpoint?: string;
  otelExporterOtlpEndpoint?: string;
  npmPackageVersion?: string;
}

export function initializeOpenTelemetry(config?: OpenTelemetryConfig): void {
  try {
    if (sdk) return; // already initialized

    const nodeEnv = config?.nodeEnv ?? 'development';
    const serviceName = config?.serviceName ?? 'auth-service';
    const npmPackageVersion = config?.npmPackageVersion ?? '0.0.0';
    const otelExporterOtlpEndpoint = config?.otelExporterOtlpEndpoint;

    const level =
      nodeEnv === 'production' ? DiagLogLevel.ERROR : DiagLogLevel.INFO;
    diag.setLogger(new DiagConsoleLogger(), level);

    // Configure resource attributes for better observability correlation
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: nodeEnv,
      [SemanticResourceAttributes.SERVICE_VERSION]: npmPackageVersion,
    });

    // Prefer Jaeger exporter if endpoint provided; otherwise try OTLP
    const traceExporters: unknown[] = [];
    if (config?.jaegerEndpoint) {
      traceExporters.push(
        new JaegerExporter({
          endpoint: config.jaegerEndpoint,
        })
      );
    } else if (config?.otelEndpoint || otelExporterOtlpEndpoint) {
      traceExporters.push(
        new OTLPTraceExporter({
          // grpc endpoint (e.g., http://otel-collector:4317)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          url: (config?.otelEndpoint || otelExporterOtlpEndpoint)!,
        })
      );
    }

    // Optional: logs exporter via OTLP if available
    const logExporter =
      config?.otelEndpoint || otelExporterOtlpEndpoint
        ? new OTLPLogExporter({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            url: (config?.otelEndpoint || otelExporterOtlpEndpoint)!,
          })
        : undefined;

    sdk = new NodeSDK({
      instrumentations: [getNodeAutoInstrumentations()],
      resource: resource as Resource,
      traceExporter: traceExporters[0] as OTLPTraceExporter | JaegerExporter, // use first configured exporter
      // logs are optional; NodeSDK will ignore undefined
      logRecordProcessor: logExporter ? undefined : undefined,
    });

    void sdk.start();

    diag.info('OpenTelemetry initialized successfully');
  } catch (error) {
    diag.error('Failed to initialize OpenTelemetry', error);
  }
}

export async function shutdownOpenTelemetry(): Promise<void> {
  try {
    if (!sdk) return;
    await sdk.shutdown();
  } catch (error) {
    diag.error('Failed to shutdown OpenTelemetry', error);
  }
}
