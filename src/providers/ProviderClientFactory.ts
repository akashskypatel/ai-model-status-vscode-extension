import type { ProviderConfig } from "../domain/types";
import type { AIProviderClient } from "./AIProviderClient";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";

export function createProviderClient(
  provider: ProviderConfig
): AIProviderClient {
  switch (provider.type) {
    case "openai-compatible":
      return new OpenAICompatibleClient(provider);

    default: {
      const unreachable: never = provider.type;
      throw new Error(`Unsupported provider type: ${unreachable}`);
    }
  }
}