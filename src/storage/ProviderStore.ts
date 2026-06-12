import * as vscode from "vscode";
import type { ProviderConfig, ProviderInput } from "../domain/types";

const PROVIDERS_KEY = "aiModelStatus.providers";

export class ProviderStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async listProviders(): Promise<ProviderConfig[]> {
    return this.context.globalState.get<ProviderConfig[]>(PROVIDERS_KEY, []);
  }

  async getProvider(id: string): Promise<ProviderConfig | undefined> {
    const providers = await this.listProviders();
    return providers.find(provider => provider.id === id);
  }

  async addProvider(input: ProviderInput): Promise<ProviderConfig> {
    const providers = await this.listProviders();
    const now = new Date().toISOString();

    const provider: ProviderConfig = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      type: input.type,
      endpoint: normalizeEndpoint(input.endpoint),
      authKind: input.authKind,
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

  async updateProvider(
    id: string,
    input: Partial<ProviderInput>
  ): Promise<ProviderConfig> {
    const providers = await this.listProviders();
    const existing = providers.find(provider => provider.id === id);

    if (!existing) {
      throw new Error(`Provider not found: ${id}`);
    }

    const updated: ProviderConfig = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      type: input.type ?? existing.type,
      endpoint: input.endpoint
        ? normalizeEndpoint(input.endpoint)
        : existing.endpoint,
      authKind: input.authKind ?? existing.authKind,
      updatedAt: new Date().toISOString()
    };

    validateProvider(updated);

    await this.context.globalState.update(
      PROVIDERS_KEY,
      providers.map(provider => provider.id === id ? updated : provider)
    );

    if (input.apiKey !== undefined) {
      if (input.apiKey.length > 0) {
        await this.setApiKey(id, input.apiKey);
      } else {
        await this.deleteApiKey(id);
      }
    }

    return updated;
  }

  async deleteProvider(id: string): Promise<void> {
    const providers = await this.listProviders();

    await this.context.globalState.update(
      PROVIDERS_KEY,
      providers.filter(provider => provider.id !== id)
    );

    await this.deleteApiKey(id);
  }

  async getApiKey(providerId: string): Promise<string | undefined> {
    return this.context.secrets.get(getApiKeySecretKey(providerId));
  }

  async setApiKey(providerId: string, apiKey: string): Promise<void> {
    await this.context.secrets.store(
      getApiKeySecretKey(providerId),
      apiKey
    );
  }

  async deleteApiKey(providerId: string): Promise<void> {
    await this.context.secrets.delete(getApiKeySecretKey(providerId));
  }
}

function getApiKeySecretKey(providerId: string): string {
  return `aiModelStatus.provider.${providerId}.apiKey`;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.trim().replace(/\/+$/, "");
}

function validateProvider(provider: ProviderConfig): void {
  if (!provider.name) {
    throw new Error("Provider name is required.");
  }

  if (!provider.endpoint) {
    throw new Error("Provider endpoint is required.");
  }

  try {
    const url = new URL(provider.endpoint);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Provider endpoint must use http or https.");
    }
  } catch {
    throw new Error("Provider endpoint must be a valid URL.");
  }
}