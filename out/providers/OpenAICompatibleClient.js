"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICompatibleClient = void 0;
const errors_1 = require("../domain/errors");
const AIProviderClient_1 = require("./AIProviderClient");
class OpenAICompatibleClient {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async probe(credentials) {
        try {
            await this.fetchModels(credentials);
            return { status: "connected" };
        }
        catch (error) {
            if (error instanceof errors_1.ProviderRequestError) {
                return {
                    status: error.status,
                    errorMessage: error.message
                };
            }
            return {
                status: "provider_error",
                errorMessage: (0, errors_1.getErrorMessage)(error)
            };
        }
    }
    async listModels(credentials) {
        try {
            const response = await this.fetchModels(credentials);
            const models = response.data?.map(model => (0, AIProviderClient_1.toAIModel)(this.provider.id, model)) ?? [];
            return {
                providerId: this.provider.id,
                providerStatus: "connected",
                models
            };
        }
        catch (error) {
            if (error instanceof errors_1.ProviderRequestError) {
                return {
                    providerId: this.provider.id,
                    providerStatus: error.status,
                    models: [],
                    errorMessage: error.message
                };
            }
            return {
                providerId: this.provider.id,
                providerStatus: "provider_error",
                models: [],
                errorMessage: (0, errors_1.getErrorMessage)(error)
            };
        }
    }
    async pingModel(modelId, credentials) {
        try {
            const statusCode = await this.fetchChatCompletionPing(modelId, credentials);
            return {
                providerId: this.provider.id,
                modelId,
                connectivityStatus: "available",
                statusCode
            };
        }
        catch (error) {
            const statusCode = error instanceof errors_1.ProviderRequestError
                ? error.statusCode
                : undefined;
            return {
                providerId: this.provider.id,
                modelId,
                connectivityStatus: "unavailable",
                statusCode,
                errorMessage: (0, errors_1.getErrorMessage)(error)
            };
        }
    }
    async fetchChatCompletionPing(modelId, credentials) {
        const endpoint = getOpenAICompatibleUrl(this.provider.endpoint, "/v1/chat/completions");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                signal: controller.signal,
                headers: {
                    ...this.getHeaders(credentials),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        {
                            role: "user",
                            content: "ping"
                        }
                    ],
                    max_tokens: 1
                })
            });
            if (!response.ok) {
                throw new errors_1.ProviderRequestError(`Model ping returned HTTP ${response.status}.`, response.status === 401 || response.status === 403
                    ? "auth_error"
                    : "provider_error", response.status);
            }
            return response.status;
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new errors_1.ProviderRequestError("Model ping timed out after 10 seconds.", "network_error");
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async fetchModels(credentials) {
        const endpoint = getOpenAICompatibleUrl(this.provider.endpoint, "/v1/models");
        let response;
        try {
            response = await fetch(endpoint, {
                method: "GET",
                headers: this.getHeaders(credentials)
            });
        }
        catch (error) {
            throw new errors_1.ProviderRequestError(`Could not reach provider endpoint: ${(0, errors_1.getErrorMessage)(error)}`, "network_error");
        }
        if (response.status === 401 || response.status === 403) {
            throw new errors_1.ProviderRequestError("Provider rejected the API key.", "auth_error");
        }
        if (response.status === 404) {
            throw new errors_1.ProviderRequestError("Provider does not expose an OpenAI-compatible /models endpoint.", "invalid_endpoint");
        }
        if (!response.ok) {
            throw new errors_1.ProviderRequestError(`Provider returned HTTP ${response.status}.`, "provider_error");
        }
        const body = await response.json();
        if (!Array.isArray(body.data)) {
            throw new errors_1.ProviderRequestError("Provider response did not contain a valid models array.", "provider_error");
        }
        return body;
    }
    getHeaders(credentials) {
        const headers = {
            "Accept": "application/json"
        };
        if (this.provider.authKind === "api-key") {
            if (!credentials.apiKey) {
                throw new errors_1.ProviderRequestError("Provider requires an API key.", "auth_error");
            }
            headers.Authorization = `Bearer ${credentials.apiKey}`;
        }
        return headers;
    }
}
exports.OpenAICompatibleClient = OpenAICompatibleClient;
function getOpenAICompatibleUrl(baseEndpoint, path) {
    const base = baseEndpoint.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (base.endsWith("/v1") && normalizedPath.startsWith("/v1/")) {
        return `${base}${normalizedPath.slice("/v1".length)}`;
    }
    return `${base}${normalizedPath}`;
}
//# sourceMappingURL=OpenAICompatibleClient.js.map