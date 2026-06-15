export type ProviderType = "openai-compatible";

export type ProviderAuthKind = "api-key" | "none";

export type ProviderConfig = {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  authKind: ProviderAuthKind;
  maxRequestsPerMinute?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProviderInput = {
  name: string;
  type: ProviderType;
  endpoint: string;
  authKind: ProviderAuthKind;
  apiKey?: string;
  maxRequestsPerMinute?: number;
};

export type ProviderStatus =
  | "unknown"
  | "connected"
  | "auth_error"
  | "network_error"
  | "invalid_endpoint"
  | "provider_error";

export type ModelType =
  | "chat"
  | "embedding"
  | "image"
  | "audio"
  | "reranker"
  | "completion"
  | "unknown";

export type ConnectivityStatus =
  | "unknown"
  | "available"
  | "unavailable";

export type AIModel = {
  id: string;
  providerId: string;
  name: string;
  type: ModelType;
  connectivityStatus: ConnectivityStatus;
  lastPingedAt?: string;
  lastPingStatusCode?: number;
  lastPingErrorMessage?: string;
  raw?: unknown;
};

export type ProviderModelsResult = {
  providerId: string;
  providerStatus: ProviderStatus;
  models: AIModel[];
  errorMessage?: string;
};

export type CategorizedModels = Record<ModelType, AIModel[]>;

export type ModelCatalogSnapshot = {
  providers: ProviderConfig[];
  results: ProviderModelsResult[];
  categorizedModels: CategorizedModels;
};