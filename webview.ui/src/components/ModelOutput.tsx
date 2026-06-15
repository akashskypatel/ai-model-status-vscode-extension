import { useMemo, useState, useEffect } from "react";
import type {
  AIModel,
  ExtensionMessage,
  ModelCatalogSnapshot,
  ModelType,
  ProviderConfig,
  ProviderStatus
} from "../types";
import { getModelPingKey } from "../utils";
import { MODEL_TYPES } from "../constants";
import { vscode } from "../vscodeApi";
type ModelOutputProps = {
  providers: ProviderConfig[];
  snapshot?: ModelCatalogSnapshot;
  output: unknown;
  onRefreshModels(): void;
  onRefreshProvider(providerId: string): void;
  onRefreshModel(providerId: string, modelId: string): void;
  pendingModelPings: Set<string>;
  pingedModels: Set<string>;
  refreshingProviders: Set<string>;
  onEditProvider(provider: ProviderConfig): void;
};

export function ModelOutput({
  providers,
  snapshot,
  output,
  onRefreshModels,
  onRefreshProvider,
  onRefreshModel,
  pendingModelPings,
  pingedModels,
  refreshingProviders,
  onEditProvider
}: ModelOutputProps) {
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;
      if (message.type === "exportAllModels") {
        exportAllFilteredModels();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [providers, snapshot, filterText, pingedModels, refreshingProviders]);

  const providerGroups = useMemo(
    () => buildProviderGroups(providers, snapshot, filterText),
    [providers, snapshot, filterText]
  );

  const exportAllFilteredModels = (): void => {
    const allModels = providerGroups.flatMap(group => group.models);
    const exportedData = allModels.map(model => {
      const provider = providers.find(p => p.id === model.providerId);
      return {
        description: model.name,
        id: model.id,
        baseUrl: provider?.endpoint || "",
        name: model.name,
        envKey: `${provider?.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`
      };
    });

    const jsonString = JSON.stringify(exportedData, null, 2);
    copyToClipboard(jsonString);
  };

  if (!snapshot) {
    return (
      <section className="model-view">
        <pre>
          {typeof output === "string"
            ? output
            : JSON.stringify(output, null, 2)}
        </pre>
      </section>
    );
  }

  if (providerGroups.length === 0) {
    return (
      <section className="model-view">
        <div className="empty model-empty">
          No providers added yet. Use the + button in the view title.
        </div>
      </section>
    );
  }

  return (
    <section className="model-view">
      <div className="provider-accordion-list">
        <div className="filter-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="Filter models... (use 'avail*' or 'unavail*')"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>
        {providerGroups.map(group => (
          <ProviderAccordion
            key={group.provider.id}
            group={group}
            onRefreshProvider={onRefreshProvider}
            onRefreshModel={onRefreshModel}
            pendingModelPings={pendingModelPings}
            pingedModels={pingedModels}
            refreshingProviders={refreshingProviders}
            onEditProvider={onEditProvider}
          />
        ))}
      </div>
    </section>
  );
}

type ProviderGroup = {
  provider: ProviderConfig;
  providerStatus: ProviderStatus;
  errorMessage?: string;
  models: AIModel[];
};

function filterModels(models: AIModel[], filterText: string): AIModel[] {
  if (!filterText.trim()) {
    return models;
  }

  const normalizedFilter = filterText.toLowerCase().trim();

  // Handle special wildcards for availability filtering
  // Check "unavail" FIRST since it contains "avail"
  if (normalizedFilter.startsWith("unavail")) {
    return models.filter(model => model.connectivityStatus === "unavailable");
  }

  if (normalizedFilter.startsWith("avail")) {
    return models.filter(model => model.connectivityStatus === "available");
  }

  // Handle model type filtering (e.g., "type:chat", "chat", "embed", etc.)
  const typeFilterMatch = normalizedFilter.match(/^type:(.+)$/);
  if (typeFilterMatch) {
    const typeValue = typeFilterMatch[1];
    return models.filter(model => model.type.toLowerCase().includes(typeValue));
  }

  // Also allow direct type filtering by checking if filter matches a known ModelType
  const knownTypes: ModelType[] = MODEL_TYPES;
  if (knownTypes.some(t => t.toLowerCase() === normalizedFilter)) {
    return models.filter(model => model.type.toLowerCase() === normalizedFilter);
  }

  // Default text search on model name and id
  return models.filter(
    model =>
      model.name.toLowerCase().includes(normalizedFilter) ||
      model.id.toLowerCase().includes(normalizedFilter) ||
      model.type.toLowerCase().includes(normalizedFilter) ||
      model.connectivityStatus.toLowerCase().includes(normalizedFilter)
  );
}

type ProviderAccordionProps = {
  group: ProviderGroup;
  onRefreshProvider(providerId: string): void;
  onRefreshModel(providerId: string, modelId: string): void;
  pendingModelPings: Set<string>;
  pingedModels: Set<string>;
  refreshingProviders: Set<string>;
  onEditProvider(provider: ProviderConfig): void;
};

function ProviderAccordion({
  group,
  onRefreshProvider,
  onRefreshModel,
  pendingModelPings,
  pingedModels,
  refreshingProviders,
  onEditProvider
}: ProviderAccordionProps) {
  const modelCount = group.models.length;

  const getPingedCountForProvider = (
    providerId: string,
    models: AIModel[],
    pinged: Set<string>
  ): number => {
    let count = 0;
    for (const model of models) {
      const key = getModelPingKey(providerId, model.id);
      if (pinged.has(key)) {
        count++;
      }
    }
    return count;
  };

  const pingedCount = getPingedCountForProvider(
    group.provider.id,
    group.models,
    pingedModels
  );

  return (
    <details className="provider-section" open>
      <summary className="provider-summary">
        <span className="provider-summary-left">
          <span
            className="provider-chevron codicon codicon-chevron-right provider-chevron-closed"
            aria-hidden="true"
          />
          <span
            className="provider-chevron codicon codicon-chevron-down provider-chevron-open"
            aria-hidden="true"
          />

          <span className="provider-title">{group.provider.name}</span>

          <span className="provider-model-count">
            {refreshingProviders.has(group.provider.id) ? (
              <span className="provider-progress" title={`${pingedCount}/${modelCount} models pinged`}>
                {pingedCount}/{modelCount} ({Math.round((pingedCount / modelCount) * 100)}%)
              </span>
            ) : (
              modelCount
            )}
          </span>
        </span>

        <span className="provider-actions">
          <button
            type="button"
            className="icon-button provider-refresh-button"
            aria-label={`Refresh ${group.provider.name}`}
            title="Refresh provider models"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              onRefreshProvider(group.provider.id);
            }}
          >
            <span className="codicon codicon-refresh" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="icon-button provider-edit-button"
            aria-label={`Edit ${group.provider.name}`}
            title="Edit provider"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              onEditProvider(group.provider);
            }}
          >
            <span className="codicon codicon-edit" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="icon-button provider-export-button"
            aria-label={`Export ${group.provider.name} models`}
            title="Export filtered models"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              exportModels(group.models, group.provider);
            }}
          >
            <span className="codicon codicon-download" aria-hidden="true" />
          </button>
        </span>
      </summary>

      <div className="provider-section-body">
        {group.errorMessage && (
          <div className="error provider-error">{group.errorMessage}</div>
        )}

        {group.models.length === 0 && !group.errorMessage && (
          <div className="empty provider-empty">
            No models discovered for this provider.
          </div>
        )}

        {group.models.length > 0 && (
          <div className="model-card-list">
            {group.models.map(model => (
              <ModelCard
                key={`${model.providerId}:${model.id}`}
                model={model}
                isPinging={pendingModelPings.has(getModelPingKey(model.providerId, model.id))}
                hasBeenPinged={
                  pingedModels.has(getModelPingKey(model.providerId, model.id)) ||
                  !!model.lastPingedAt
                }
                onRefreshModel={onRefreshModel}
              />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

type ModelCardProps = {
  model: AIModel;
  isPinging: boolean;
  hasBeenPinged: boolean;
  onRefreshModel(providerId: string, modelId: string): void;
};

function ModelCard({
  model,
  isPinging,
  hasBeenPinged,
  onRefreshModel
}: ModelCardProps) {
  const owner = typeof model.raw?.owned_by === "string"
    ? model.raw.owned_by
    : getOwnerFromModelId(model.id);

  const formatLastPinged = (isoDate?: string): string => {
    if (!isoDate) return "Not yet pinged";
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const getHttpStatusDescription = (statusCode?: number): string => {
    if (!statusCode) return "Unknown status";
    const descriptions: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      408: "Request Timeout",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout"
    };
    return descriptions[statusCode] || `HTTP ${statusCode}`;
  };

  const statusTooltip = () => {
    const base = model.lastPingedAt
      ? `Last checked: ${formatLastPinged(model.lastPingedAt)}`
      : "Not yet pinged";
    
    if (model.connectivityStatus === "unavailable") {
      if (model.lastPingStatusCode) {
        return `${base}\nStatus: ${model.connectivityStatus}\n${getHttpStatusDescription(model.lastPingStatusCode)}`;
      }
      if (model.lastPingErrorMessage) {
        return `${base}\nStatus: ${model.connectivityStatus}\n${model.lastPingErrorMessage}`;
      }
      return `${base}\nStatus: ${model.connectivityStatus}`;
    }
    
    return `${base}\nStatus: ${model.connectivityStatus}`;
  };

  return (
    <article className="model-card">
      <div className="model-card-header">
        <div className="model-card-title-row">
        <strong className="model-card-title" title={model.name}>
          {model.name}
        </strong>

        <button
          type="button"
          className="icon-button model-copy-button"
          aria-label={`Copy ${model.name}`}
          title="Copy model name"
          onClick={() => copyToClipboard(model.name)}
        >
          <span className="codicon codicon-copy" aria-hidden="true" />
        </button>
      </div>
        {/* Refresh button */}
        {isPinging ? (
          <span
            className="model-refresh-spinner codicon codicon-loading codicon-modifier-spin"
            aria-label={`Pinging ${model.name}`}
            title="Pinging model"
          />
        ) : (
          <button
            type="button"
            className="icon-button model-refresh-button"
            aria-label={`Refresh ${model.name}`}
            title="Ping model"
            onClick={() => onRefreshModel(model.providerId, model.id)}
          >
            <span className="codicon codicon-refresh" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="model-card-footer">
        <div className="model-card-meta">
          <span>{model.type}</span>
          {owner && <span>{owner}</span>}
        </div>

        {hasBeenPinged && (
          <span
            className={`status-pill status-${model.connectivityStatus}`}
            title={statusTooltip()}
          >
            {model.connectivityStatus}
          </span>
        )}
      </div>
    </article>
  );
}

function buildProviderGroups(
  providers: ProviderConfig[],
  snapshot?: ModelCatalogSnapshot,
  filterText?: string
): ProviderGroup[] {
  if (!snapshot) {
    return providers.map(provider => ({
      provider,
      providerStatus: "unknown",
      models: []
    }));
  }

  return snapshot.providers.map(provider => {
    const result = snapshot.results.find(item => item.providerId === provider.id);

    return {
      provider,
      providerStatus: result?.providerStatus ?? "unknown",
      errorMessage: result?.errorMessage,
      models: sortModels(filterModels(result?.models ?? [], filterText || ""))
    };
  });
}

function sortModels(models: AIModel[]): AIModel[] {
  return [...models].sort((left, right) => {
    const typeCompare = left.type.localeCompare(right.type);

    if (typeCompare !== 0) {
      return typeCompare;
    }

    return left.name.localeCompare(right.name);
  });
}

function getOwnerFromModelId(modelId: string): string | undefined {
  const [owner] = modelId.split("/");

  if (!owner || owner === modelId) {
    return undefined;
  }

  return owner;
}

function exportModels(models: AIModel[], provider: ProviderConfig): void {
  const exportedData = models.map(model => ({
    description: model.name,
    id: model.id,
    baseUrl: provider.endpoint,
    name: model.name,
    envKey: `${provider.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`
  }));

  const jsonString = JSON.stringify(exportedData, null, 2);
  copyToClipboard(jsonString);
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
  vscode.postMessage({ type: "showNotification", payload: { message: "Copied to clipboard!" } });
}