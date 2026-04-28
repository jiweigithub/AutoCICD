import * as k8s from "@pulumi/kubernetes";

const namespace = "ulw";

export const postgresPVC = new k8s.core.v1.PersistentVolumeClaim("postgres-pvc", {
  metadata: {
    namespace,
    name: "postgresql-data",
    labels: { "app.kubernetes.io/name": "postgresql" },
  },
  spec: {
    accessModes: ["ReadWriteOnce"],
    resources: { requests: { storage: "20Gi" } },
    storageClassName: "standard",
  },
});

export const redisPVC = new k8s.core.v1.PersistentVolumeClaim("redis-pvc", {
  metadata: {
    namespace,
    name: "redis-data",
    labels: { "app.kubernetes.io/name": "redis" },
  },
  spec: {
    accessModes: ["ReadWriteOnce"],
    resources: { requests: { storage: "10Gi" } },
    storageClassName: "standard",
  },
});

export const minioPVC = new k8s.core.v1.PersistentVolumeClaim("minio-pvc", {
  metadata: {
    namespace,
    name: "minio-data",
    labels: { "app.kubernetes.io/name": "minio" },
  },
  spec: {
    accessModes: ["ReadWriteOnce"],
    resources: { requests: { storage: "50Gi" } },
    storageClassName: "standard",
  },
});
