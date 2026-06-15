"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidHttpUrl = isValidHttpUrl;
function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=validation.js.map