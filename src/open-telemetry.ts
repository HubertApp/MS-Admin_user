import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';
import { metrics } from '@opentelemetry/api';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'ms-admin-user',
});

// Traces → Grafana Tempo via OTLP HTTP
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTLP_ENDPOINT ?? 'http://tempo:4318/v1/traces',
});

const tracerProvider = new NodeTracerProvider({
  resource,
  spanProcessors: [new BatchSpanProcessor(traceExporter)],
});
tracerProvider.register();

// Métriques → Prometheus (scraped par Grafana)
const prometheusExporter = new PrometheusExporter({
  port: parseInt(process.env.PROMETHEUS_PORT ?? '9464'),
});

const meterProvider = new MeterProvider({
  resource,
  readers: [prometheusExporter],
});
metrics.setGlobalMeterProvider(meterProvider);

// Auto-instrumentation HTTP, Express, GraphQL, MongoDB
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new GraphQLInstrumentation({ mergeItems: true }),
    new MongooseInstrumentation(),
  ],
  tracerProvider,
  meterProvider,
});