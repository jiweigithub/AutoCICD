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
          { port: 8080, protocol: "TCP" },
          { port: 9090, protocol: "TCP" },
        ],
      },
    ],
    egress: [
      {
        to: [
          { namespaceSelector: { matchLabels: { name: "ulw" } } },
          { podSelector: { matchLabels: { "app.kubernetes.io/name": "redis" } } },
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
                service: { name: "openclaw", port: { number: 8080 } },
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
    "redis.url": "redis://redis.ulw.svc.cluster.local:6379",
    "minio.endpoint": "http://minio.ulw.svc.cluster.local:9000",
    "log.level": environment === "production" ? "info" : "debug",
    "openclaw.max.concurrency": environment === "production" ? "10" : "3",
  },
});

export const secrets = new k8s.core.v1.Secret("ulw-secrets", {
  metadata: { namespace, name: "ulw-secrets" },
  stringData: {
    "redis.password": "changeme-in-prod-use-sealed-secrets",
    "minio.access-key": "minioadmin",
    "minio.secret-key": "changeme-in-prod-use-sealed-secrets",
  },
});
