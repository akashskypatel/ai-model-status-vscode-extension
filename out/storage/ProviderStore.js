"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderStore = void 0;
const validation_1 = require("../domain/validation");
const PROVIDERS_KEY = "aiModelStatus.providers";
class ProviderStore {
    context;
    constructor(context) {
        this.context = context;
    }
    async listProviders() {
        return this.context.globalState.get(PROVIDERS_KEY, []);
    }
    async getProvider(id) {
        const providers = await this.listProviders();
        return providers.find(provider => provider.id === id);
    }
    async addProvider(input) {
        const providers = await this.listProviders();
        const now = new Date().toISOString();
        const provider = {
            id: crypto.randomUUID(),
            name: input.name.trim(),
            type: input.type,
            endpoint: normalizeEndpoint(input.endpoint),
            authKind: input.authKind,
            maxRequestsPerMinute: normalizeMaxRequestsPerMinute(input.maxRequestsPerMinute),
            createdAt: now,
            updatedAt: now
        };
        validateProvider(provider);
        await this.context.globalState.update(PROVIDERS_KEY, [
            ...providers,
            provider
        ]);
        if (input.authKind === "api-key" && input.apiKey) {
            await this.setApiKey(provider.id, input.apiKey);
        }
        return provider;
    }
    async updateProvider(id, input) {
        const providers = await this.listProviders();
        const existing = providers.find(provider => provider.id === id);
        if (!existing) {
            throw new Error(`Provider not found: ${id}`);
        }
        const updated = {
            ...existing,
            name: input.name?.trim() ?? existing.name,
            type: input.type ?? existing.type,
            endpoint: input.endpoint
                ? normalizeEndpoint(input.endpoint)
                : existing.endpoint,
            authKind: input.authKind ?? existing.authKind,
            maxRequestsPerMinute: input.maxRequestsPerMinute !== undefined
                ? normalizeMaxRequestsPerMinute(input.maxRequestsPerMinute)
                : existing.maxRequestsPerMinute,
            updatedAt: new Date().toISOString()
        };
        validateProvider(updated);
        await this.context.globalState.update(PROVIDERS_KEY, providers.map(provider => provider.id === id ? updated : provider));
        if (input.apiKey !== undefined) {
            if (input.apiKey.length > 0) {
                await this.setApiKey(id, input.apiKey);
            }
            else {
                await this.deleteApiKey(id);
            }
        }
        return updated;
    }
    async deleteProvider(id) {
        const providers = await this.listProviders();
        await this.context.globalState.update(PROVIDERS_KEY, providers.filter(provider => provider.id !== id));
        await this.deleteApiKey(id);
    }
    async getApiKey(providerId) {
        return this.context.secrets.get(getApiKeySecretKey(providerId));
    }
    async setApiKey(providerId, apiKey) {
        await this.context.secrets.store(getApiKeySecretKey(providerId), apiKey);
    }
    async deleteApiKey(providerId) {
        await this.context.secrets.delete(getApiKeySecretKey(providerId));
    }
}
exports.ProviderStore = ProviderStore;
function normalizeMaxRequestsPerMinute(value) {
    if (value === undefined || Number.isNaN(value)) {
        return undefined;
    }
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Max Requests Per Minute must be greater than 0.");
    }
    return Math.floor(value);
}
function getApiKeySecretKey(providerId) {
    return `aiModelStatus.provider.${providerId}.apiKey`;
}
function normalizeEndpoint(endpoint) {
    return endpoint.trim().replace(/\/+$/, "");
}
function validateProvider(provider) {
    if (!provider.name) {
        throw new Error("Provider name is required.");
    }
    if (!provider.endpoint) {
        throw new Error("Provider endpoint is required.");
    }
    if (!(0, validation_1.isValidHttpUrl)(provider.endpoint)) {
        throw new Error("Provider endpoint must be a valid http or https URL.");
    }
}
//# sourceMappingURL=ProviderStore.js.map