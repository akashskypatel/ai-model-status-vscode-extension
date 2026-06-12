import type {
  ProviderConfig,
  ProviderModelsResult
} from "../domain/types";
import { getErrorMessage, ProviderRequestError } from "../domain/errors";
import type {
  AIProviderClient,
  ProbeProviderResult,
  ProviderCredentials,
  RawProviderModel
} from "./AIProviderClient";
import { toAIModel } from "./AIProviderClient";

type OpenAIModelsResponse = {
  object?: string;
  data?: RawProviderModel[];
};

export class OpenAICompatibleClient implements AIProviderClient {
  constructor(public readonly provider: ProviderConfig) {}

  async probe(credentials: ProviderCredentials): Promise<ProbeProviderResult> {
    try {
      await this.fetchModels(credentials);
      return { status: "connected" };
    } catch (error) {
      if (error instanceof ProviderRequestError) {
        return {
          status: error.status,
          errorMessage: error.message
        };
      }

      return {
        status: "provider_error",
        errorMessage: getErrorMessage(error)
      };
    }
  }

  async listModels(
    credentials: ProviderCredentials
  ): Promise<ProviderModelsResult> {
    try {
      const response = await this.fetchModels(credentials);

      const models = response.data?.map(model =>
        toAIModel(this.provider.id, model)
      ) ?? [];

      return {
        providerId: this.provider.id,
        providerStatus: "connected",
        models
      };
    } catch (error) {
      if (error instanceof ProviderRequestError) {
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
        errorMessage: getErrorMessage(error)
      };
    }
  }

  private async fetchModels(
    credentials: ProviderCredentials
  ): Promise<OpenAIModelsResponse> {
    const endpoint = `${this.provider.endpoint}/v1/models`;

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: this.getHeaders(credentials)
      });
    } catch (error) {
      throw new ProviderRequestError(
        `Could not reach provider endpoint: ${getErrorMessage(error)}`,
        "network_error"
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new ProviderRequestError(
        "Provider rejected the API key.",
        "auth_error"
      );
    }

    if (response.status === 404) {
      throw new ProviderRequestError(
        "Provider does not expose an OpenAI-compatible /v1/models endpoint.",
        "invalid_endpoint"
      );
    }

    if (!response.ok) {
      throw new ProviderRequestError(
        `Provider returned HTTP ${response.status}.`,
        "provider_error"
      );
    }

    const body = await response.json() as OpenAIModelsResponse;

    if (!Array.isArray(body.data)) {
      throw new ProviderRequestError(
        "Provider response did not contain a valid models array.",
        "provider_error"
      );
    }

    return body;
  }

  private getHeaders(credentials: ProviderCredentials): Record<string, string> {
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };

    if (this.provider.authKind === "api-key") {
      if (!credentials.apiKey) {
        throw new ProviderRequestError(
          "Provider requires an API key.",
          "auth_error"
        );
      }

      headers.Authorization = `Bearer ${credentials.apiKey}`;
    }

    return headers;
  }
}