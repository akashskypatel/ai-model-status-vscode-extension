"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTIVITY_STATUSES = exports.PROVIDER_STATUSES = exports.MODEL_TYPES = void 0;
exports.MODEL_TYPES = [
    "chat",
    "embedding",
    "image",
    "audio",
    "reranker",
    "completion",
    "unknown"
];
exports.PROVIDER_STATUSES = [
    "unknown",
    "connected",
    "auth_error",
    "network_error",
    "invalid_endpoint",
    "provider_error"
];
exports.CONNECTIVITY_STATUSES = [
    "unknown",
    "available",
    "unavailable"
];
//# sourceMappingURL=constants.js.map