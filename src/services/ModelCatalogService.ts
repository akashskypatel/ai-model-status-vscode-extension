import type {
  AIModel,
  CategorizedModels,
  ModelCatalogSnapshot,
  ModelType,
  ProviderModelsResult
} from "../domain/types";
import { createProviderClient } from "../providers/ProviderClientFactory";
import { ProviderStore } from "../storage/ProviderStore";

const MODEL_TYPES: ModelType[] = [
  "chat",
  "embedding",
  "image",
  "audio",
  "reranker",
  "completion",
  "unknown"
];

export class ModelCatalogService {
  constructor(private readonly providerStore: ProviderStore) {}

  async getSnapshot(): Promise<ModelCatalogSnapshot> {
    const providers = await this.providerStore.listProviders();

    const results = await Promise.all(
      providers.map(async provider => {
        const client = createProviderClient(provider);
        const apiKey = await this.providerStore.getApiKey(provider.id);

        return client.listModels({ apiKey });
      })
    );

    return {
      providers,
      results,
      categorizedModels: categorizeModels(results)
    };
  }

  async refreshProvider(providerId: string): Promise<ProviderModelsResult> {
    const provider = await this.providerStore.getProvider(providerId);

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const client = createProviderClient(provider);
    const apiKey = await this.providerStore.getApiKey(provider.id);

    return client.listModels({ apiKey });
  }

  async probeProvider(providerId: string) {
    const provider = await this.providerStore.getProvider(providerId);

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const client = createProviderClient(provider);
    const apiKey = await this.providerStore.getApiKey(provider.id);

    return client.probe({ apiKey });
  }
}

export function categorizeModels(
  results: ProviderModelsResult[]
): CategorizedModels {
  const categorized = MODEL_TYPES.reduce((accumulator, type) => {
    accumulator[type] = [];
    return accumulator;
  }, {} as CategorizedModels);

  for (const result of results) {
    for (const model of result.models) {
      categorized[model.type].push(model);
    }
  }

  sortModels(categorized);

  return categorized;
}

function sortModels(categorized: CategorizedModels): void {
  for (const models of Object.values(categorized) as AIModel[][]) {
    models.sort((left, right) => left.name.localeCompare(right.name));
  }
}