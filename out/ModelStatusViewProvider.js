"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelStatusViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const ProviderStore_1 = require("./storage/ProviderStore");
const ModelCatalogService_1 = require("./services/ModelCatalogService");
const errors_1 = require("./domain/errors");
class ModelStatusViewProvider {
    context;
    static viewType = "aiModelStatus.modelStatusView";
    webviewView;
    providerStore;
    modelCatalogService;
    constructor(context) {
        this.context = context;
        this.providerStore = new ProviderStore_1.ProviderStore(context);
        this.modelCatalogService = new ModelCatalogService_1.ModelCatalogService(this.providerStore);
    }
    resolveWebviewView(webviewView) {
        this.webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, "webview.ui", "dist"),
                vscode.Uri.joinPath(this.context.extensionUri, "node_modules", "@vscode", "codicons", "dist")
            ]
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(message => this.handleMessage(message), undefined, this.context.subscriptions);
    }
    async refreshModels() {
        const snapshot = await this.modelCatalogService.getSnapshot();
        await this.postMessage({
            type: "modelSnapshotUpdated",
            payload: snapshot
        });
    }
    async postProviders() {
        const providers = await this.providerStore.listProviders();
        await this.postMessage({
            type: "providersUpdated",
            payload: providers
        });
    }
    async showAddProvider() {
        await this.postMessage({
            type: "showAddProvider",
            payload: {}
        });
    }
    async showSettings() {
        await this.postMessage({
            type: "showSettings",
            payload: {}
        });
    }
    async handleMessage(message) {
        try {
            switch (message.type) {
                case "ready": {
                    await this.postProviders();
                    await this.refreshModels();
                    return;
                }
                case "listProviders": {
                    await this.postProviders();
                    return;
                }
                case "addProvider": {
                    const provider = await this.providerStore.addProvider(message.payload);
                    const probe = await this.modelCatalogService.probeProvider(provider.id);
                    await this.postProviders();
                    await this.postMessage({
                        type: "providerProbeResult",
                        payload: {
                            providerId: provider.id,
                            ...probe
                        }
                    });
                    await this.refreshModels();
                    return;
                }
                case "updateProvider": {
                    const provider = await this.providerStore.updateProvider(message.payload.providerId, message.payload.input);
                    const probe = await this.modelCatalogService.probeProvider(provider.id);
                    await this.postProviders();
                    await this.postMessage({
                        type: "providerProbeResult",
                        payload: {
                            providerId: provider.id,
                            ...probe
                        }
                    });
                    await this.refreshModels();
                    return;
                }
                case "deleteProvider": {
                    await this.providerStore.deleteProvider(message.payload.providerId);
                    await this.postProviders();
                    await this.refreshModels();
                    return;
                }
                case "refreshModels": {
                    await this.refreshModels();
                    return;
                }
                case "refreshProvider": {
                    const result = await this.modelCatalogService.refreshProvider(message.payload.providerId);
                    await this.postMessage({
                        type: "providerModelsUpdated",
                        payload: result
                    });
                    return;
                }
                case "probeProvider": {
                    const result = await this.modelCatalogService.probeProvider(message.payload.providerId);
                    await this.postMessage({
                        type: "providerProbeResult",
                        payload: {
                            providerId: message.payload.providerId,
                            ...result
                        }
                    });
                    return;
                }
                case "pingModel": {
                    const result = await this.modelCatalogService.pingModel(message.payload.providerId, message.payload.modelId);
                    await this.postMessage({
                        type: "modelPingResult",
                        payload: result
                    });
                    return;
                }
                case "pingProviderModels": {
                    await this.modelCatalogService.pingProviderModels(message.payload.providerId, message.payload.modelIds, async (result) => {
                        await this.postMessage({
                            type: "modelPingResult",
                            payload: result
                        });
                    });
                    return;
                }
                default: {
                    const unreachable = message;
                    throw new Error(`Unsupported webview message: ${JSON.stringify(unreachable)}`);
                }
            }
        }
        catch (error) {
            await this.postMessage({
                type: "error",
                payload: {
                    requestType: message.type,
                    message: (0, errors_1.getErrorMessage)(error)
                }
            });
        }
    }
    async postMessage(message) {
        await this.webviewView?.webview.postMessage(message);
    }
    getHtml(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "webview.ui", "dist", "assets", "index.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "webview.ui", "dist", "assets", "index.css"));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "node_modules", "@vscode", "codicons", "dist", "codicon.css"));
        const nonce = getNonce();
        return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            http-equiv="Content-Security-Policy"
            content="
              default-src 'none';
              img-src ${webview.cspSource} https:;
              font-src ${webview.cspSource};
              style-src ${webview.cspSource} 'nonce-${nonce}';
              script-src 'nonce-${nonce}';
            "
          />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="${codiconsUri}" nonce="${nonce}" />
          <link rel="stylesheet" href="${styleUri}" nonce="${nonce}" />
          <title>AI Model Status</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }
}
exports.ModelStatusViewProvider = ModelStatusViewProvider;
function getNonce() {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let index = 0; index < 32; index++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=ModelStatusViewProvider.js.map