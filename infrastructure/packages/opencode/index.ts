import * as k8s from "@pulumi/kubernetes";

const namespace = "ulw";

/**
 * OpenCode job pod template — spawned by OpenClaw for each TDD session.
 * Each pipeline run's TDD code generation gets an isolated pod.
 */
export const jobTemplate: k8s.types.input.batch.v1.JobSpec = {
  template: {
    metadata: { labels: { "app.kubernetes.io/name": "opencode", "app.kubernetes.io/component": "tdd-runtime" } },
    spec: {
      restartPolicy: "Never",
      containers: [{
        name: "opencode",
        image: "opencode-runtime:latest",
        env: [
          { name: "REDIS_URL", value: "redis://redis.ulw.svc.cluster.local:6379" },
          { name: "MINIO_ENDPOINT", value: "http://minio.ulw.svc.cluster.local:9000" },
        ],
        resources: {
          requests: { cpu: "1", memory: "1Gi" },
          limits: { cpu: "4", memory: "4Gi" },
        },
        volumeMounts: [{ name: "workspace", mountPath: "/workspace" }],
      }],
      volumes: [{ name: "workspace", emptyDir: {} }],
    },
  },
  backoffLimit: 0,
  ttlSecondsAfterFinished: 86400, // clean up after 24h
};
