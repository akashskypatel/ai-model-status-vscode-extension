import type {
  AIModel,
  ModelCatalogSnapshot,
  ModelType,
  ProviderConfig,
  ProviderModelsResult,
  ProviderStatus
} from "./types";
import { MODEL_TYPES, PROVIDER_STATUSES, CONNECTIVITY_STATUSES } from "./constants";

export function readModelCatalogSnapshot(
  payload: unknown
): ModelCatalogSnapshot | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const value = payload as Partial<ModelCatalogSnapshot>;

  if (!Array.isArray(value.providers) || !Array.isArray(value.results)) {
    return undefined;
  }

  return {
    providers: value.providers.filter(isProviderConfig),
    results: value.results.filter(isProviderModelsResult),
    categorizedModels: readCategorizedModels(value.categorizedModels)
  };
}

export function getProviderName(
  snapshot: ModelCatalogSnapshot,
  providerId: string
): string {
  return snapshot.providers.find(provider => provider.id === providerId)?.name
    ?? "Unknown provider";
}

export function getAllModels(snapshot: ModelCatalogSnapshot): AIModel[] {
  return snapshot.results.flatMap(result => result.models);
}

export function groupModelsByType(models: AIModel[]): Record<ModelType, AIModel[]> {
  return MODEL_TYPES.reduce((groups, type) => {
    groups[type] = models
      .filter(model => model.type === type)
      .sort((left, right) => left.name.localeCompare(right.name));

    return groups;
  }, {} as Record<ModelType, AIModel[]>);
}

function readCategorizedModels(
  value: unknown
): Partial<Record<ModelType, AIModel[]>> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const categorized = value as Partial<Record<ModelType, unknown>>;
  const result: Partial<Record<ModelType, AIModel[]>> = {};

  for (const type of MODEL_TYPES) {
    const models = categorized[type];

    if (Array.isArray(models)) {
      result[type] = models.filter(isAIModel);
    }
  }

  return result;
}

function isProviderModelsResult(value: unknown): value is ProviderModelsResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Partial<ProviderModelsResult>;

  return (
    typeof result.providerId === "string" &&
    isProviderStatus(result.providerStatus) &&
    Array.isArray(result.models) &&
    result.models.every(isAIModel) &&
    (
      result.errorMessage === undefined ||
      typeof result.errorMessage === "string"
    )
  );
}

function isAIModel(value: unknown): value is AIModel {
  if (!value || typeof value !== "object") {
    return false;
  }

  const model = value as Partial<AIModel>;

  return (
    typeof model.id === "string" &&
    typeof model.providerId === "string" &&
    typeof model.name === "string" &&
    isModelType(model.type) &&
    isConnectivityStatus(model.connectivityStatus)
  );
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

export function isModelType(value: unknown): value is ModelType {
  return typeof value === "string" && MODEL_TYPES.includes(value as ModelType);
}

export function isProviderStatus(value: unknown): value is ProviderStatus {
  return (
    typeof value === "string" &&
    PROVIDER_STATUSES.includes(value as ProviderStatus)
  );
}

export function isConnectivityStatus(value: unknown): value is ConnectivityStatus {
  return (
    typeof value === "string" &&
    CONNECTIVITY_STATUSES.includes(value as ConnectivityStatus)
  );
}