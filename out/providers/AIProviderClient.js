"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAIModel = toAIModel;
function toAIModel(providerId, rawModel) {
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
function inferModelType(modelId) {
    const id = modelId.toLowerCase();
    if (id.includes("embedding") ||
        id.includes("embed") ||
        id.startsWith("text-embedding")) {
        return "embedding";
    }
    if (id.includes("dall-e") ||
        id.includes("image") ||
        id.includes("vision-generate")) {
        return "image";
    }
    if (id.includes("whisper") ||
        id.includes("tts") ||
        id.includes("audio") ||
        id.includes("transcribe")) {
        return "audio";
    }
    if (id.includes("rerank") ||
        id.includes("reranker")) {
        return "reranker";
    }
    if (id.includes("instruct") ||
        id.includes("davinci") ||
        id.includes("babbage") ||
        id.includes("curie")) {
        return "completion";
    }
    if (id.includes("gpt") ||
        id.includes("chat") ||
        id.includes("claude") ||
        id.includes("llama") ||
        id.includes("mistral") ||
        id.includes("qwen") ||
        id.includes("deepseek") ||
        id.includes("gemma")) {
        return "chat";
    }
    return "unknown";
}
//# sourceMappingURL=AIProviderClient.js.map