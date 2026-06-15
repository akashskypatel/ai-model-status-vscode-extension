"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelCatalogService = void 0;
exports.categorizeModels = categorizeModels;
const constants_1 = require("../domain/constants");
const ProviderClientFactory_1 = require("../providers/ProviderClientFactory");
class ModelCatalogService {
    providerStore;
    constructor(providerStore) {
        this.providerStore = providerStore;
    }
    async getSnapshot() {
        const providers = await this.providerStore.listProviders();
        const results = await Promise.all(providers.map(async (provider) => {
            const client = (0, ProviderClientFactory_1.createProviderClient)(provider);
            const apiKey = await this.providerStore.getApiKey(provider.id);
            return client.listModels({ apiKey });
        }));
        return {
            providers,
            results,
            categorizedModels: categorizeModels(results)
        };
    }
    async refreshProvider(providerId) {
        const provider = await this.providerStore.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        const client = (0, ProviderClientFactory_1.createProviderClient)(provider);
        const apiKey = await this.providerStore.getApiKey(provider.id);
        return client.listModels({ apiKey });
    }
    async probeProvider(providerId) {
        const provider = await this.providerStore.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        const client = (0, ProviderClientFactory_1.createProviderClient)(provider);
        const apiKey = await this.providerStore.getApiKey(provider.id);
        return client.probe({ apiKey });
    }
    async pingModel(providerId, modelId) {
        const provider = await this.providerStore.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        const client = (0, ProviderClientFactory_1.createProviderClient)(provider);
        const apiKey = await this.providerStore.getApiKey(provider.id);
        return client.pingModel(modelId, { apiKey });
    }
    async pingProviderModels(providerId, modelIds, onResult) {
        const provider = await this.providerStore.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        const delayMs = getDelayMs(provider.maxRequestsPerMinute);
        for (const modelId of modelIds) {
            const result = await this.pingModel(providerId, modelId);
            await onResult(result);
            if (result.statusCode === 429) {
                await sleep(15_000);
                continue;
            }
            if (delayMs > 0) {
                await sleep(delayMs);
            }
        }
    }
}
exports.ModelCatalogService = ModelCatalogService;
function getDelayMs(maxRequestsPerMinute) {
    if (!maxRequestsPerMinute || maxRequestsPerMinute <= 0) {
        return 0;
    }
    return Math.ceil(60_000 / maxRequestsPerMinute);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function categorizeModels(results) {
    const categorized = constants_1.MODEL_TYPES.reduce((accumulator, type) => {
        accumulator[type] = [];
        return accumulator;
    }, {});
    for (const result of results) {
        for (const model of result.models) {
            categorized[model.type].push(model);
        }
    }
    sortModels(categorized);
    return categorized;
}
function sortModels(categorized) {
    for (const models of Object.values(categorized)) {
        models.sort((left, right) => left.name.localeCompare(right.name));
    }
}
//# sourceMappingURL=ModelCatalogService.js.map