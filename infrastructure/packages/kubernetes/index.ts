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

export { networkPolicies } from "./networking.js";
export { configMaps, secrets, ingress } from "./networking.js";
export { redisPVC, minioPVC } from "./storage.js";
