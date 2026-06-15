"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRequestError = void 0;
exports.getErrorMessage = getErrorMessage;
class ProviderRequestError extends Error {
    status;
    statusCode;
    constructor(message, status, statusCode) {
        super(message);
        this.status = status;
        this.statusCode = statusCode;
        this.name = "ProviderRequestError";
    }
}
exports.ProviderRequestError = ProviderRequestError;
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
//# sourceMappingURL=errors.js.map