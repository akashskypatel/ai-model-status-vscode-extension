import type { ProviderInput } from "./types";

export type WebviewRequest =
  | {
    type: "ready";
  }
  | {
    type: "listProviders";
  }
  | {
    type: "addProvider";
    payload: ProviderInput;
  }
  | {
    type: "updateProvider";
    payload: {
      providerId: string;
      input: Partial<ProviderInput>;
    };
  }
  | {
    type: "deleteProvider";
    payload: {
      providerId: string;
    };
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
    type: "probeProvider";
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
    type: "pingProviderModels";
    payload: {
      providerId: string;
      modelIds: string[];
    };
  };

export type WebviewResponse =
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
      connectivityStatus: "available" | "unavailable";
      errorMessage?: string;
    };
  }
  | {
    type: "showAddProvider";
    payload: {};
  }
  | {
    type: "showSettings";
    payload: {};
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
      type: "pingProviderModels";
      payload: {
        providerId: string;
        modelIds: string[];
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
    };