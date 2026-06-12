import { useEffect, useState } from "react";
import { ModelOutput } from "./components/ModelOutput";
import { ProviderForm } from "./components/ProviderForm";
import { ProviderList } from "./components/ProviderList";
import type { ExtensionMessage, ProviderConfig, ProviderInput, ModelCatalogSnapshot } from "./types";
import { vscode } from "./vscodeApi";
import { readModelCatalogSnapshot } from "./modelSnapshot";

export function App() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | undefined>();
  const [isProviderFormVisible, setIsProviderFormVisible] = useState(false);
  const [output, setOutput] = useState<unknown>("Loading...");
  const [formError, setFormError] = useState<string | undefined>();
  const [modelSnapshot, setModelSnapshot] = useState<ModelCatalogSnapshot | undefined>();

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
        case "providerModelsUpdated":
        case "providerProbeResult":
          setOutput(message.payload);
          return;

        case "error":
          setFormError(message.payload.message);
          setOutput(message.payload);
          return;

        case "showSettings":
          setOutput({
            message: "Settings UI is not implemented yet."
          });
          return;

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
    vscode.postMessage({
      type: "refreshModels"
    });
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

      <ProviderList providers={providers} onEditProvider={handleEditProvider} />

      <ModelOutput
        snapshot={modelSnapshot}
        output={output}
        onRefreshModels={handleRefreshModels}
      />
    </main>
  );
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