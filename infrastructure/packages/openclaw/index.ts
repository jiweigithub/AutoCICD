import * as k8s from "@pulumi/kubernetes";

const namespace = "ulw";

export const deployment = new k8s.apps.v1.Deployment("openclaw", {
  metadata: {
    namespace,
    name: "openclaw",
    labels: { "app.kubernetes.io/name": "openclaw", "app.kubernetes.io/component": "gateway" },
  },
  spec: {
    replicas: 2,
    strategy: { type: "RollingUpdate", rollingUpdate: { maxUnavailable: 0, maxSurge: 1 } },
    selector: { matchLabels: { "app.kubernetes.io/name": "openclaw" } },
    template: {
      metadata: { labels: { "app.kubernetes.io/name": "openclaw" } },
      spec: {
        containers: [{
          name: "openclaw",
          image: "openclaw-gateway:latest",
          ports: [
            { containerPort: 8080, name: "http" },
            { containerPort: 9090, name: "grpc" },
          ],
          env: [
            { name: "REDIS_URL", value: "redis://redis.ulw.svc.cluster.local:6379" },
            { name: "MINIO_ENDPOINT", value: "http://minio.ulw.svc.cluster.local:9000" },
            { name: "KEYCLOAK_URL", value: "http://keycloak.ulw.svc.cluster.local:8080" },
            { name: "CONFIG_PATH", value: "/etc/openclaw/config.yml" },
          ],
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "2", memory: "2Gi" },
          },
          volumeMounts: [
            { name: "config", mountPath: "/etc/openclaw" },
          ],
          livenessProbe: {
            httpGet: { path: "/health", port: 8080 },
            initialDelaySeconds: 10,
            periodSeconds: 10,
          },
          readinessProbe: {
            httpGet: { path: "/health/ready", port: 8080 },
            initialDelaySeconds: 5,
            periodSeconds: 5,
          },
        }],
        volumes: [{
          name: "config",
          configMap: { name: "openclaw-config" },
        }],
      },
    },
  },
});

export const service = new k8s.core.v1.Service("openclaw-svc", {
  metadata: {
    namespace,
    name: "openclaw",
    labels: { "app.kubernetes.io/name": "openclaw" },
  },
  spec: {
    type: "ClusterIP",
    selector: { "app.kubernetes.io/name": "openclaw" },
    ports: [
      { name: "http", port: 8080, targetPort: 8080, protocol: "TCP" },
      { name: "grpc", port: 9090, targetPort: 9090, protocol: "TCP" },
    ],
  },
});
