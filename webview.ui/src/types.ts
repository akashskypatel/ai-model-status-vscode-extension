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

export type ExtensionMessage =
  | {
    type: "showAddProvider";
    payload: {};
  }
  | {
    type: "showSettings";
    payload: {};
  }
  | {
    type: "providersUpdated";
    payload: unknown;
  }
  | {
    type: "modelSnapshotUpdated";
    payload: unknown;
  }
  | {
    type: "providerModelsUpdated";
    payload: unknown;
  }
  | {
    type: "providerProbeResult";
    payload: unknown;
  }
  | {
    type: "modelPingResult";
    payload: {
      providerId: string;
      modelId: string;
      connectivityStatus: ConnectivityStatus;
      statusCode?: number;
      errorMessage?: string;
    };
  }
  | {
    type: "error";
    payload: {
      requestType?: string;
      message: string;
    };
  }
  | {
    type: "exportAllModels";
  };

export type WebviewMessage =
  | {
    type: "ready";
  }
  | {
    type: "refreshModels";
  }
  | {
    type: "refreshProvider";
    payload: {
      providerId: string;
    };
  }
  | {
    type: "pingModel";
    payload: {
      providerId: string;
      modelId: string;
    };
  }
  | {
    type: "addProvider";
    payload: ProviderInput;
  }
  | {
    type: "updateProvider";
    payload: {
      providerId: string;
      input: ProviderInput;
    };
  }
  | {
    type: "pingProviderModels";
    payload: {
      providerId: string;
      modelIds: string[];
    };
  }
  | {
    type: "showNotification";
    payload: {
      message: string;
    };
  }
  | {
    type: "saveModelSnapshot";
    payload: ModelCatalogSnapshot;
  };

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

export type ProviderStatus =
  | "unknown"
  | "connected"
  | "auth_error"
  | "network_error"
  | "invalid_endpoint"
  | "provider_error";

export type AIModel = {
  id: string;
  providerId: string;
  name: string;
  type: ModelType;
  connectivityStatus: ConnectivityStatus;
  lastPingedAt?: string;
  lastPingStatusCode?: number;
  lastPingErrorMessage?: string;
  raw?: {
    id?: string;
    object?: string;
    created?: number;
    owned_by?: string;
    [key: string]: unknown;
  };
};

export type ProviderModelsResult = {
  providerId: string;
  providerStatus: ProviderStatus;
  models: AIModel[];
  errorMessage?: string;
};

export type ModelCatalogSnapshot = {
  providers: ProviderConfig[];
  results: ProviderModelsResult[];
  categorizedModels?: Partial<Record<ModelType, AIModel[]>>;
};