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