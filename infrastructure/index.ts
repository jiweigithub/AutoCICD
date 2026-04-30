import * as k8s from "./packages/kubernetes/index.js";
import * as database from "./packages/database/index.js";
import * as cache from "./packages/cache/index.js";
import * as messaging from "./packages/messaging/index.js";
import * as storage from "./packages/storage/index.js";
import * as openclaw from "./packages/openclaw/index.js";
import * as observability from "./packages/observability/index.js";

export const namespace = k8s.namespace;
export const networkPolicies = k8s.networkPolicies;
export const ingress = k8s.ingress;
export const configMaps = k8s.configMaps;
export const secrets = k8s.secrets;

export const redis = cache.deployment;

export const minio = storage.deployment;

export const openclawDeployment = openclaw.deployment;
export const openclawService = openclaw.service;

export const prometheus = observability.prometheus;
export const grafana = observability.grafana;
export const openTelemetryCollector = observability.openTelemetryCollector;
