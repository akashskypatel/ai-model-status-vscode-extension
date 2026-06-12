"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: "assets/index.js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: assetInfo => {
                    if (assetInfo.name?.endsWith(".css")) {
                        return "assets/index.css";
                    }
                    return "assets/[name][extname]";
                }
            }
        }
    }
});
//# sourceMappingURL=vite.config.js.map