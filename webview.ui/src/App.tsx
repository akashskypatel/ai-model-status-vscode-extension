import { useEffect, useState } from "react";
import { ModelOutput } from "./components/ModelOutput";
import { ProviderForm } from "./components/ProviderForm";
import type {
  ExtensionMessage,
  ModelCatalogSnapshot,
  ProviderConfig,
  ProviderInput,
  ProviderModelsResult,
  ProviderStatus
} from "./types";
import { vscode } from "./vscodeApi";
import { readModelCatalogSnapshot } from "./modelSnapshot";

export function App() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | undefined>();
  const [isProviderFormVisible, setIsProviderFormVisible] = useState(false);
  const [output, setOutput] = useState<unknown>("Loading...");
  const [formError, setFormError] = useState<string | undefined>();
  const [modelSnapshot, setModelSnapshot] = useState<ModelCatalogSnapshot | undefined>();
  const [pendingModelPings, setPendingModelPings] = useState<Set<string>>(
    () => new Set()
  );
  const [pingedModels, setPingedModels] = useState<Set<string>>(
    () => new Set<string>()
  );
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "showAddProvider":
          setEditingProvider(undefined);
          setFormError(undefined);
          setIsProviderFormVisible(true);
          return;

        case "providersUpdated":
          setProviders(readProviders(message.payload));
          return;

        case "modelSnapshotUpdated": {
          const snapshot = readModelCatalogSnapshot(message.payload);

          setModelSnapshot(snapshot);
          setOutput(snapshot ?? message.payload);
          return;
        }
        case "providerModelsUpdated": {
          if (!isProviderModelsResult(message.payload)) {
            setOutput(message.payload);
            return;
          }

          const updatedResult = message.payload;

          setModelSnapshot(current => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              results: current.results.map(existing =>
                existing.providerId === updatedResult.providerId
                  ? updatedResult
                  : existing
              )
            };
          });

          setOutput(updatedResult);
          return;
        }
        case "providerProbeResult":
          setOutput(message.payload);
          return;

        case "error": {
          setFormError(message.payload.message);
          setOutput(message.payload);
          return;
        }

        case "showSettings":
          setOutput({
            message: "Settings UI is not implemented yet."
          });
          return;

        case "modelPingResult": {
          const result = message.payload;
          const key = getModelPingKey(result.providerId, result.modelId);

          setPendingModelPings(current => {
            const next = new Set(current);
            next.delete(key);
            return next;
          });

          setPingedModels(current => {
            const next = new Set(current);
            next.add(key);
            return next;
          });

          setModelSnapshot(current => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              results: current.results.map(providerResult => {
                if (providerResult.providerId !== result.providerId) {
                  return providerResult;
                }

                return {
                  ...providerResult,
                  models: providerResult.models.map(model => {
                    if (model.id !== result.modelId) {
                      return model;
                    }

                    return {
                      ...model,
                      connectivityStatus: result.connectivityStatus
                    };
                  })
                };
              })
            };
          });

          setOutput(result);
          return;
        }

        default: {
          const unreachable: never = message;
          setOutput(unreachable);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    vscode.postMessage({
      type: "ready"
    });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  function handleAddProvider(input: ProviderInput): void {
    vscode.postMessage({
      type: "addProvider",
      payload: input
    });

    setIsProviderFormVisible(false);
    setEditingProvider(undefined);
    setFormError(undefined);
  }

  function handleUpdateProvider(providerId: string, input: ProviderInput): void {
    vscode.postMessage({
      type: "updateProvider",
      payload: {
        providerId,
        input
      }
    });

    setIsProviderFormVisible(false);
    setEditingProvider(undefined);
    setFormError(undefined);
  }

  function handleEditProvider(provider: ProviderConfig): void {
    setEditingProvider(provider);
    setFormError(undefined);
    setIsProviderFormVisible(true);
  }

  function handleCancelProviderForm(): void {
    setIsProviderFormVisible(false);
    setEditingProvider(undefined);
    setFormError(undefined);
  }

  function handleRefreshModels(): void {
    setPingedModels(new Set<string>());
    setPendingModelPings(new Set<string>());

    vscode.postMessage({
      type: "refreshModels"
    });
  }


  function readProviders(payload: unknown): ProviderConfig[] {
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.filter(isProviderConfig);
  }

  function isProviderConfig(value: unknown): value is ProviderConfig {
    if (!value || typeof value !== "object") {
      return false;
    }

    const provider = value as Partial<ProviderConfig>;

    return (
      typeof provider.id === "string" &&
      typeof provider.name === "string" &&
      provider.type === "openai-compatible" &&
      typeof provider.endpoint === "string" &&
      (provider.authKind === "api-key" || provider.authKind === "none")
    );
  }

  function handleRefreshProvider(providerId: string): void {
    vscode.postMessage({
      type: "refreshProvider",
      payload: {
        providerId
      }
    });
  }

  function getModelPingKey(providerId: string, modelId: string): string {
    return `${providerId}:${modelId}`;
  }

  function handleRefreshModel(providerId: string, modelId: string): void {
    const key = getModelPingKey(providerId, modelId);

    setPendingModelPings(current => {
      if (current.has(key)) {
        return current;
      }

      const next = new Set(current);
      next.add(key);
      return next;
    });

    vscode.postMessage({
      type: "pingModel",
      payload: {
        providerId,
        modelId
      }
    });
  }

  function isProviderModelsResult(value: unknown): value is ProviderModelsResult {
    if (!value || typeof value !== "object") {
      return false;
    }

    const result = value as Partial<ProviderModelsResult>;

    return (
      typeof result.providerId === "string" &&
      isProviderStatus(result.providerStatus) &&
      Array.isArray(result.models)
    );
  }

  function isProviderStatus(value: unknown): value is ProviderStatus {
    return (
      value === "unknown" ||
      value === "connected" ||
      value === "auth_error" ||
      value === "network_error" ||
      value === "invalid_endpoint" ||
      value === "provider_error"
    );
  }

  return (
    <main className="app">
      {isProviderFormVisible && (
        <ProviderForm
          provider={editingProvider}
          error={formError}
          onAddProvider={handleAddProvider}
          onUpdateProvider={handleUpdateProvider}
          onCancel={handleCancelProviderForm}
        />
      )}

      <ModelOutput
        providers={providers}
        snapshot={modelSnapshot}
        output={output}
        onRefreshModels={handleRefreshModels}
        onRefreshProvider={handleRefreshProvider}
        onRefreshModel={handleRefreshModel}
        pendingModelPings={pendingModelPings}
        pingedModels={pingedModels}
        onEditProvider={handleEditProvider}
      />
    </main>
  );
}
