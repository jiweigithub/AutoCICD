import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const namespace = "ulw";

export const deployment = new k8s.apps.v1.Deployment("postgresql", {
  metadata: {
    namespace,
    name: "postgresql",
    labels: { "app.kubernetes.io/name": "postgresql", "app.kubernetes.io/component": "database" },
  },
  spec: {
    replicas: 1,
    strategy: { type: "Recreate" },
    selector: { matchLabels: { "app.kubernetes.io/name": "postgresql" } },
    template: {
      metadata: { labels: { "app.kubernetes.io/name": "postgresql" } },
      spec: {
        containers: [{
          name: "postgresql",
          image: "postgres:16-alpine",
          ports: [{ containerPort: 5432, name: "postgres" }],
          env: [
            { name: "POSTGRES_DB", value: "ulw" },
            { name: "POSTGRES_USER", value: "ulw" },
            {
              name: "POSTGRES_PASSWORD",
              valueFrom: { secretKeyRef: { name: "ulw-secrets", key: "postgres.password" } },
            },
            { name: "PGDATA", value: "/var/lib/postgresql/data/pgdata" },
          ],
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "2", memory: "2Gi" },
          },
          volumeMounts: [{ name: "data", mountPath: "/var/lib/postgresql/data" }],
          livenessProbe: {
            exec: { command: ["pg_isready", "-U", "ulw"] },
            initialDelaySeconds: 30,
            periodSeconds: 10,
          },
          readinessProbe: {
            exec: { command: ["pg_isready", "-U", "ulw"] },
            initialDelaySeconds: 5,
            periodSeconds: 5,
          },
        }],
        volumes: [{
          name: "data",
          persistentVolumeClaim: { claimName: "postgresql-data" },
        }],
      },
    },
  },
});

export const service = new k8s.core.v1.Service("postgresql-svc", {
  metadata: {
    namespace,
    name: "postgresql",
    labels: { "app.kubernetes.io/name": "postgresql" },
  },
  spec: {
    type: "ClusterIP",
    selector: { "app.kubernetes.io/name": "postgresql" },
    ports: [{ port: 5432, targetPort: 5432, name: "postgres" }],
  },
});
