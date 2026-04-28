import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const namespace = "ulw";

export const deployment = new k8s.apps.v1.Deployment("nats", {
  metadata: {
    namespace,
    name: "nats",
    labels: { "app.kubernetes.io/name": "nats", "app.kubernetes.io/component": "messaging" },
  },
  spec: {
    replicas: 1,
    strategy: { type: "Recreate" },
    selector: { matchLabels: { "app.kubernetes.io/name": "nats" } },
    template: {
      metadata: { labels: { "app.kubernetes.io/name": "nats" } },
      spec: {
        containers: [{
          name: "nats",
          image: "nats:2.10-alpine",
          ports: [
            { containerPort: 4222, name: "client" },
            { containerPort: 8222, name: "monitoring" },
          ],
          args: [
            "--config", "/etc/nats/nats.conf",
            "--jetstream",
          ],
          env: [{
            name: "NATS_AUTH_TOKEN",
            valueFrom: { secretKeyRef: { name: "ulw-secrets", key: "nats.auth-token" } },
          }],
          resources: {
            requests: { cpu: "200m", memory: "256Mi" },
            limits: { cpu: "1", memory: "1Gi" },
          },
          livenessProbe: {
            httpGet: { path: "/healthz", port: 8222 },
            initialDelaySeconds: 10,
            periodSeconds: 10,
          },
          readinessProbe: {
            httpGet: { path: "/healthz", port: 8222 },
            initialDelaySeconds: 5,
            periodSeconds: 5,
          },
        }],
      },
    },
  },
});

export const service = new k8s.core.v1.Service("nats-svc", {
  metadata: {
    namespace,
    name: "nats",
    labels: { "app.kubernetes.io/name": "nats" },
  },
  spec: {
    type: "ClusterIP",
    selector: { "app.kubernetes.io/name": "nats" },
    ports: [
      { name: "client", port: 4222, targetPort: 4222 },
      { name: "monitoring", port: 8222, targetPort: 8222 },
    ],
  },
});
