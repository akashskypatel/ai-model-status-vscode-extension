import type { AIModel, ModelCatalogSnapshot, ModelType } from "../types";
import {
  getAllModels,
  getProviderName,
  groupModelsByType
} from "../modelSnapshot";

type ModelOutputProps = {
  snapshot?: ModelCatalogSnapshot;
  output: unknown;
  onRefreshModels(): void;
};

const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  chat: "Chat",
  embedding: "Embedding",
  image: "Image",
  audio: "Audio",
  reranker: "Reranker",
  completion: "Completion",
  unknown: "Unknown"
};

const MODEL_TYPE_ORDER: ModelType[] = [
  "chat",
  "completion",
  "embedding",
  "image",
  "audio",
  "reranker",
  "unknown"
];

export function ModelOutput({
  snapshot,
  output,
  onRefreshModels
}: ModelOutputProps) {
  const models = snapshot ? getAllModels(snapshot) : [];
  const groupedModels = groupModelsByType(models);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Models</h2>
          {snapshot && (
            <div className="muted">
              {models.length} model{models.length === 1 ? "" : "s"} discovered
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

      {snapshot && models.length === 0 && (
        <div className="empty">No models discovered yet.</div>
      )}

      {snapshot && models.length > 0 && (
        <div className="model-groups">
          {MODEL_TYPE_ORDER.map(type => {
            const modelsForType = groupedModels[type];

            if (modelsForType.length === 0) {
              return null;
            }

            return (
              <section key={type} className="model-group">
                <h3>
                  {MODEL_TYPE_LABELS[type]}
                  <span className="model-count">{modelsForType.length}</span>
                </h3>

                <div className="model-card-list">
                  {modelsForType.map(model => (
                    <ModelCard
                      key={`${model.providerId}:${model.id}`}
                      model={model}
                      providerName={getProviderName(snapshot, model.providerId)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

type ModelCardProps = {
  model: AIModel;
  providerName: string;
};

function ModelCard({ model, providerName }: ModelCardProps) {
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
        <span>{providerName}</span>
        <span>{model.type}</span>
        {owner && <span>{owner}</span>}
      </div>
    </article>
  );
}

function getOwnerFromModelId(modelId: string): string | undefined {
  const [owner] = modelId.split("/");

  if (!owner || owner === modelId) {
    return undefined;
  }

  return owner;
}