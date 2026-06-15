"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProviderClient = createProviderClient;
const OpenAICompatibleClient_1 = require("./OpenAICompatibleClient");
function createProviderClient(provider) {
    switch (provider.type) {
        case "openai-compatible":
            return new OpenAICompatibleClient_1.OpenAICompatibleClient(provider);
        default: {
            const unreachable = provider.type;
            throw new Error(`Unsupported provider type: ${unreachable}`);
        }
    }
}
//# sourceMappingURL=ProviderClientFactory.js.map