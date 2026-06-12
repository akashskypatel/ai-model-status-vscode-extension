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
      type: "error";
      payload: {
        requestType?: string;
        message: string;
      };
    };