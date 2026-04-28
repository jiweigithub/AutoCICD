import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();
const environment = config.require("ulw:environment");

export const namespace = new k8s.core.v1.Namespace("ulw", {
  metadata: {
    name: "ulw",
    labels: { environment },
  },
});

export const serviceAccount = new k8s.core.v1.ServiceAccount("ulw-orchestrator", {
  metadata: {
    namespace: namespace.metadata.name,
    name: "ulw-orchestrator",
    labels: { "app.kubernetes.io/component": "orchestrator" },
  },
});

export const orchestratorRole = new k8s.rbac.v1.Role("ulw-orchestrator-role", {
  metadata: {
    namespace: namespace.metadata.name,
    name: "ulw-orchestrator-role",
  },
  rules: [
    {
      apiGroups: [""],
      resources: ["pods", "services", "configmaps", "secrets"],
      verbs: ["get", "list", "watch", "create", "update", "patch", "delete"],
    },
    {
      apiGroups: ["batch"],
      resources: ["jobs", "cronjobs"],
      verbs: ["get", "list", "watch", "create", "update", "delete"],
    },
  ],
});

export const roleBinding = new k8s.rbac.v1.RoleBinding("ulw-orchestrator-binding", {
  metadata: {
    namespace: namespace.metadata.name,
    name: "ulw-orchestrator-binding",
  },
  subjects: [{ kind: "ServiceAccount", name: serviceAccount.metadata.name, namespace: namespace.metadata.name }],
  roleRef: {
    apiGroup: "rbac.authorization.k8s.io",
    kind: "Role",
    name: orchestratorRole.metadata.name,
  },
});

export { networkPolicies } from "./networking.js";
export { configMaps, secrets, ingress } from "./networking.js";
export { postgresPVC, redisPVC, minioPVC } from "./storage.js";
