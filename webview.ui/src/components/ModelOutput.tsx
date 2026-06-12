import { useMemo, useState } from "react";
import type {
  AIModel,
  ModelCatalogSnapshot,
  ProviderConfig,
  ProviderModelsResult,
  ProviderStatus
} from "../types";

type ModelOutputProps = {
  providers: ProviderConfig[];
  snapshot?: ModelCatalogSnapshot;
  output: unknown;
  onRefreshModels(): void;
  onEditProvider(provider: ProviderConfig): void;
};

export function ModelOutput({
  providers,
  snapshot,
  output,
  onRefreshModels,
  onEditProvider
}: ModelOutputProps) {
  const providerGroups = useMemo(
    () => buildProviderGroups(providers, snapshot),
    [providers, snapshot]
  );

  const totalModelCount = providerGroups.reduce(
    (total, group) => total + group.models.length,
    0
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Models</h2>
          {snapshot && (
            <div className="muted">
              {totalModelCount} model{totalModelCount === 1 ? "" : "s"} discovered
            </div>
          )}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={onRefreshModels}
        >
          Refresh
        </button>
      </div>

      {!snapshot && (
        <pre>
          {typeof output === "string"
            ? output
            : JSON.stringify(output, null, 2)}
        </pre>
      )}

      {snapshot && providerGroups.length === 0 && (
        <div className="empty">No providers added yet. Use the + button in the view title.</div>
      )}

      {snapshot && providerGroups.length > 0 && (
        <div className="provider-accordion-list">
          {providerGroups.map(group => (
            <ProviderAccordion
              key={group.provider.id}
              group={group}
              onEditProvider={onEditProvider}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type ProviderGroup = {
  provider: ProviderConfig;
  providerStatus: ProviderStatus;
  errorMessage?: string;
  models: AIModel[];
};

type ProviderAccordionProps = {
  group: ProviderGroup;
  onEditProvider(provider: ProviderConfig): void;
};

function ProviderAccordion({
  group,
  onEditProvider
}: ProviderAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="provider-accordion">
      <div className="provider-accordion-header">
        <button
          type="button"
          className="provider-accordion-toggle"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(current => !current)}
        >
          <span
            className={`provider-chevron codicon ${
              isOpen ? "codicon-chevron-down" : "codicon-chevron-right"
            }`}
            aria-hidden="true"
          />
          <span className="provider-title">{group.provider.name}</span>
        </button>

        <button
          type="button"
          className="icon-button provider-edit-button"
          aria-label={`Edit ${group.provider.name}`}
          title="Edit provider"
          onClick={() => onEditProvider(group.provider)}
        >
          <span className="codicon codicon-edit" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div className="provider-accordion-body">
          {group.errorMessage && (
            <div className="error">{group.errorMessage}</div>
          )}

          {group.models.length === 0 && !group.errorMessage && (
            <div className="empty">No models discovered for this provider.</div>
          )}

          {group.models.length > 0 && (
            <div className="model-card-list">
              {group.models.map(model => (
                <ModelCard
                  key={`${model.providerId}:${model.id}`}
                  model={model}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

type ModelCardProps = {
  model: AIModel;
};

function ModelCard({ model }: ModelCardProps) {
  const owner = typeof model.raw?.owned_by === "string"
    ? model.raw.owned_by
    : getOwnerFromModelId(model.id);

  return (
    <article className="model-card">
      <div className="model-card-header">
        <strong title={model.name}>{model.name}</strong>
        <span className={`status-pill status-${model.connectivityStatus}`}>
          {model.connectivityStatus}
        </span>
      </div>

      <div className="model-card-meta">
        <span>{model.type}</span>
        {owner && <span>{owner}</span>}
      </div>
    </article>
  );
}

function buildProviderGroups(
  providers: ProviderConfig[],
  snapshot?: ModelCatalogSnapshot
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
      models: sortModels(result?.models ?? [])
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