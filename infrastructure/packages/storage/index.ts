import * as k8s from "@pulumi/kubernetes";

const namespace = "ulw";

export const deployment = new k8s.apps.v1.Deployment("minio", {
  metadata: {
    namespace,
    name: "minio",
    labels: { "app.kubernetes.io/name": "minio", "app.kubernetes.io/component": "storage" },
  },
  spec: {
    replicas: 1,
    strategy: { type: "Recreate" },
    selector: { matchLabels: { "app.kubernetes.io/name": "minio" } },
    template: {
      metadata: { labels: { "app.kubernetes.io/name": "minio" } },
      spec: {
        containers: [{
          name: "minio",
          image: "minio/minio:RELEASE.2024-12-18T13-15-44Z",
          ports: [
            { containerPort: 9000, name: "api" },
            { containerPort: 9001, name: "console" },
          ],
          command: ["minio"],
          args: ["server", "/data", "--console-address", ":9001"],
          env: [
            {
              name: "MINIO_ROOT_USER",
              valueFrom: { secretKeyRef: { name: "ulw-secrets", key: "minio.access-key" } },
            },
            {
              name: "MINIO_ROOT_PASSWORD",
              valueFrom: { secretKeyRef: { name: "ulw-secrets", key: "minio.secret-key" } },
            },
          ],
          resources: {
            requests: { cpu: "250m", memory: "256Mi" },
            limits: { cpu: "1", memory: "1Gi" },
          },
          volumeMounts: [{ name: "data", mountPath: "/data" }],
          livenessProbe: {
            httpGet: { path: "/minio/health/live", port: 9000 },
            initialDelaySeconds: 10,
            periodSeconds: 10,
          },
          readinessProbe: {
            httpGet: { path: "/minio/health/ready", port: 9000 },
            initialDelaySeconds: 5,
            periodSeconds: 5,
          },
        }],
        volumes: [{
          name: "data",
          persistentVolumeClaim: { claimName: "minio-data" },
        }],
      },
    },
  },
});

export const service = new k8s.core.v1.Service("minio-svc", {
  metadata: {
    namespace,
    name: "minio",
    labels: { "app.kubernetes.io/name": "minio" },
  },
  spec: {
    type: "ClusterIP",
    selector: { "app.kubernetes.io/name": "minio" },
    ports: [
      { name: "api", port: 9000, targetPort: 9000 },
      { name: "console", port: 9001, targetPort: 9001 },
    ],
  },
});
