import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();
const environment = config.require("ulw:environment");

const namespace = "ulw";

export const networkPolicies = new k8s.networking.v1.NetworkPolicy("ulw-network-policies", {
  metadata: { namespace, name: "ulw-network-policies" },
  spec: {
    podSelector: {},
    policyTypes: ["Ingress", "Egress"],
    ingress: [
      {
        from: [
          { namespaceSelector: { matchLabels: { name: "ulw" } } },
          { namespaceSelector: { matchLabels: { name: "ingress-nginx" } } },
        ],
        ports: [
          { port: 3000, protocol: "TCP" },
          { port: 8080, protocol: "TCP" },
          { port: 9090, protocol: "TCP" },
        ],
      },
    ],
    egress: [
      {
        to: [
          { namespaceSelector: { matchLabels: { name: "ulw" } } },
          { podSelector: { matchLabels: { "app.kubernetes.io/name": "postgresql" } } },
          { podSelector: { matchLabels: { "app.kubernetes.io/name": "redis" } } },
          { podSelector: { matchLabels: { "app.kubernetes.io/name": "nats" } } },
          { podSelector: { matchLabels: { "app.kubernetes.io/name": "minio" } } },
        ],
      },
      {
        to: [
          {
            ipBlock: { cidr: "0.0.0.0/0", except: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"] },
          },
        ],
        ports: [{ port: 443, protocol: "TCP" }, { port: 80, protocol: "TCP" }],
      },
    ],
  },
});

const nodePortType: pulumi.Input<"ClusterIP"> = "ClusterIP";

export const orchestratorService = new k8s.core.v1.Service("ulw-orchestrator-svc", {
  metadata: {
    namespace,
    name: "ulw-orchestrator",
    labels: { "app.kubernetes.io/component": "orchestrator" },
  },
  spec: {
    type: nodePortType,
    selector: { "app.kubernetes.io/name": "orchestrator" },
    ports: [{ name: "http", port: 3000, targetPort: 3000, protocol: "TCP" }],
  },
});

export const apiGatewayService = new k8s.core.v1.Service("ulw-api-gateway-svc", {
  metadata: {
    namespace,
    name: "ulw-api-gateway",
    labels: { "app.kubernetes.io/component": "api-gateway" },
  },
  spec: {
    type: nodePortType,
    selector: { "app.kubernetes.io/name": "api-gateway" },
    ports: [
      { name: "http", port: 8080, targetPort: 8080, protocol: "TCP" },
      { name: "trpc", port: 9090, targetPort: 9090, protocol: "TCP" },
    ],
  },
});

export const ingress = new k8s.networking.v1.Ingress("ulw-ingress", {
  metadata: {
    namespace,
    name: "ulw-ingress",
    annotations: {
      "nginx.ingress.kubernetes.io/ssl-redirect": "true",
      "cert-manager.io/cluster-issuer": "letsencrypt-prod",
    },
  },
  spec: {
    ingressClassName: "nginx",
    tls: [
      {
        hosts: ["api.ulw.dev", "*.ulw.dev"],
        secretName: "ulw-tls",
      },
    ],
    rules: [
      {
        host: "api.ulw.dev",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: { name: apiGatewayService.metadata.name, port: { number: 8080 } },
              },
            },
          ],
        },
      },
    ],
  },
});

export const configMaps = new k8s.core.v1.ConfigMap("ulw-config", {
  metadata: { namespace, name: "ulw-config" },
  data: {
    "environment": environment,
    "nats.url": "nats://nats.ulw.svc.cluster.local:4222",
    "redis.url": "redis://redis.ulw.svc.cluster.local:6379",
    "minio.endpoint": "http://minio.ulw.svc.cluster.local:9000",
    "postgres.host": "postgresql.ulw.svc.cluster.local",
    "postgres.port": "5432",
    "postgres.database": "ulw",
    "log.level": environment === "production" ? "info" : "debug",
    "agent.sandbox.runtime": "gvisor",
    "agent.max.concurrency": environment === "production" ? "10" : "3",
  },
});

export const secrets = new k8s.core.v1.Secret("ulw-secrets", {
  metadata: { namespace, name: "ulw-secrets" },
  stringData: {
    "postgres.password": "changeme-in-prod-use-sealed-secrets",
    "redis.password": "changeme-in-prod-use-sealed-secrets",
    "minio.access-key": "minioadmin",
    "minio.secret-key": "changeme-in-prod-use-sealed-secrets",
    "nats.auth-token": "changeme-in-prod-use-sealed-secrets",
  },
});
