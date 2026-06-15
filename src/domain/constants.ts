import type { ModelType, ProviderStatus, ConnectivityStatus } from "./types";

export const MODEL_TYPES: ModelType[] = [
  "chat",
  "embedding",
  "image",
  "audio",
  "reranker",
  "completion",
  "unknown"
];

export const PROVIDER_STATUSES: ProviderStatus[] = [
  "unknown",
  "connected",
  "auth_error",
  "network_error",
  "invalid_endpoint",
  "provider_error"
];

export const CONNECTIVITY_STATUSES: ConnectivityStatus[] = [
  "unknown",
  "available",
  "unavailable"
];
