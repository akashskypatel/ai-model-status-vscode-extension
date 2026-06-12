export type ProviderType = "openai-compatible";
export type ProviderAuthKind = "api-key" | "none";

export type ProviderInput = {
  name: string;
  type: ProviderType;
  endpoint: string;
  authKind: ProviderAuthKind;
  apiKey?: string;
};

export type ProviderConfig = {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  authKind: ProviderAuthKind;
  createdAt?: string;
  updatedAt?: string;
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
      type: "error";
      payload: {
        requestType?: string;
        message: string;
      };
    };

export type WebviewMessage =
  | {
      type: "ready";
    }
  | {
      type: "refreshModels";
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