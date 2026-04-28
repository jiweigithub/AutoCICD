import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const namespace = "ulw";

export const prometheus = new k8s.apps.v1.Deployment("prometheus", {
  metadata: {
    namespace,
    name: "prometheus",
    labels: { "app.kubernetes.io/name": "prometheus", "app.kubernetes.io/component": "observability" },
  },
  spec: {
    replicas: 1,
    selector: { matchLabels: { "app.kubernetes.io/name": "prometheus" } },
    template: {
      metadata: { labels: { "app.kubernetes.io/name": "prometheus" } },
      spec: {
        containers: [{
          name: "prometheus",
          image: "prom/prometheus:v2.55.0",
          ports: [{ containerPort: 9090, name: "http" }],
          args: [
            "--config.file=/etc/prometheus/prometheus.yml",
            "--storage.tsdb.path=/prometheus",
            "--storage.tsdb.retention.time=15d",
          ],
          resources: {
            requests: { cpu: "200m", memory: "512Mi" },
            limits: { cpu: "1", memory: "2Gi" },
          },
          livenessProbe: {
            httpGet: { path: "/-/healthy", port: 9090 },
            initialDelaySeconds: 30,
            periodSeconds: 15,
          },
          readinessProbe: {
            httpGet: { path: "/-/ready", port: 9090 },
            initialDelaySeconds: 10,
            periodSeconds: 10,
          },
        }],
      },
    },
  },
});

export const grafana = new k8s.apps.v1.Deployment("grafana", {
  metadata: {
    namespace,
    name: "grafana",
    labels: { "app.kubernetes.io/name": "grafana", "app.kubernetes.io/component": "observability" },
  },
  spec: {
    replicas: 1,
    selector: { matchLabels: { "app.kubernetes.io/name": "grafana" } },
    template: {
      metadata: { labels: { "app.kubernetes.io/name": "grafana" } },
      spec: {
        containers: [{
          name: "grafana",
          image: "grafana/grafana:11.3.0",
          ports: [{ containerPort: 3000, name: "http" }],
          env: [
            { name: "GF_SECURITY_ADMIN_USER", value: "admin" },
            { name: "GF_AUTH_ANONYMOUS_ENABLED", value: "false" },
            { name: "GF_UNIFIED_ALERTING_ENABLED", value: "true" },
          ],
          resources: {
            requests: { cpu: "100m", memory: "256Mi" },
            limits: { cpu: "500m", memory: "512Mi" },
          },
          livenessProbe: {
            httpGet: { path: "/api/health", port: 3000 },
            initialDelaySeconds: 60,
            periodSeconds: 30,
          },
          readinessProbe: {
            httpGet: { path: "/api/health", port: 3000 },
            initialDelaySeconds: 30,
            periodSeconds: 10,
          },
        }],
      },
    },
  },
});

export const openTelemetryCollector = new k8s.apps.v1.Deployment("otel-collector", {
  metadata: {
    namespace,
    name: "otel-collector",
    labels: { "app.kubernetes.io/name": "otel-collector", "app.kubernetes.io/component": "observability" },
  },
  spec: {
    replicas: 1,
    selector: { matchLabels: { "app.kubernetes.io/name": "otel-collector" } },
    template: {
      metadata: { labels: { "app.kubernetes.io/name": "otel-collector" } },
      spec: {
        containers: [{
          name: "otel-collector",
          image: "otel/opentelemetry-collector-contrib:0.115.0",
          ports: [
            { containerPort: 4317, name: "otlp-grpc" },
            { containerPort: 4318, name: "otlp-http" },
            { containerPort: 8888, name: "metrics" },
          ],
          args: ["--config=/etc/otelcol/config.yaml"],
          resources: {
            requests: { cpu: "100m", memory: "256Mi" },
            limits: { cpu: "500m", memory: "512Mi" },
          },
        }],
      },
    },
  },
});
