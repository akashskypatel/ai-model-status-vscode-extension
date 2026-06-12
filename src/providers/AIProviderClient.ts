import type {
  AIModel,
  ProviderConfig,
  ProviderModelsResult,
  ProviderStatus
} from "../domain/types";

export type ProviderCredentials = {
  apiKey?: string;
};

export type ProbeProviderResult = {
  status: ProviderStatus;
  errorMessage?: string;
};

export interface AIProviderClient {
  readonly provider: ProviderConfig;

  probe(credentials: ProviderCredentials): Promise<ProbeProviderResult>;

  listModels(credentials: ProviderCredentials): Promise<ProviderModelsResult>;

  pingModel(
    modelId: string,
    credentials: ProviderCredentials
  ): Promise<PingModelResult>;
}

export type PingModelResult = {
  providerId: string;
  modelId: string;
  connectivityStatus: "available" | "unavailable";
  statusCode?: number;
  errorMessage?: string;
};

export type RawProviderModel = {
  id?: string;
  object?: string;
  owned_by?: string;
  [key: string]: unknown;
};

export function toAIModel(
  providerId: string,
  rawModel: RawProviderModel
): AIModel {
  const id = typeof rawModel.id === "string" ? rawModel.id : "unknown";

  return {
    id,
    providerId,
    name: id,
    type: inferModelType(id),
    connectivityStatus: "available",
    raw: rawModel
  };
}

function inferModelType(modelId: string) {
  const id = modelId.toLowerCase();

  if (
    id.includes("embedding") ||
    id.includes("embed") ||
    id.startsWith("text-embedding")
  ) {
    return "embedding";
  }

  if (
    id.includes("dall-e") ||
    id.includes("image") ||
    id.includes("vision-generate")
  ) {
    return "image";
  }

  if (
    id.includes("whisper") ||
    id.includes("tts") ||
    id.includes("audio") ||
    id.includes("transcribe")
  ) {
    return "audio";
  }

  if (
    id.includes("rerank") ||
    id.includes("reranker")
  ) {
    return "reranker";
  }

  if (
    id.includes("instruct") ||
    id.includes("davinci") ||
    id.includes("babbage") ||
    id.includes("curie")
  ) {
    return "completion";
  }

  if (
    id.includes("gpt") ||
    id.includes("chat") ||
    id.includes("claude") ||
    id.includes("llama") ||
    id.includes("mistral") ||
    id.includes("qwen") ||
    id.includes("deepseek") ||
    id.includes("gemma")
  ) {
    return "chat";
  }

  return "unknown";
}