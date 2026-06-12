import * as vscode from "vscode";
import { ProviderStore } from "./storage/ProviderStore";
import { ModelCatalogService } from "./services/ModelCatalogService";
import { getErrorMessage } from "./domain/errors";
import type { WebviewRequest, WebviewResponse } from "./domain/webviewMessages";

export class ModelStatusViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "aiModelStatus.modelStatusView";

  private webviewView?: vscode.WebviewView;

  private readonly providerStore: ProviderStore;
  private readonly modelCatalogService: ModelCatalogService;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.providerStore = new ProviderStore(context);
    this.modelCatalogService = new ModelCatalogService(this.providerStore);
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "webview.ui", "dist"),
        vscode.Uri.joinPath(this.context.extensionUri, "node_modules", "@vscode", "codicons", "dist")
      ]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      message => this.handleMessage(message as WebviewRequest),
      undefined,
      this.context.subscriptions
    );
  }

  async refreshModels(): Promise<void> {
    const snapshot = await this.modelCatalogService.getSnapshot();

    await this.postMessage({
      type: "modelSnapshotUpdated",
      payload: snapshot
    });
  }

  async postProviders(): Promise<void> {
    const providers = await this.providerStore.listProviders();

    await this.postMessage({
      type: "providersUpdated",
      payload: providers
    });
  }

  async showAddProvider(): Promise<void> {
    await this.postMessage({
      type: "showAddProvider",
      payload: {}
    });
  }

  async showSettings(): Promise<void> {
    await this.postMessage({
      type: "showSettings",
      payload: {}
    });
  }

  private async handleMessage(message: WebviewRequest): Promise<void> {
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
          const provider = await this.providerStore.updateProvider(
            message.payload.providerId,
            message.payload.input
          );

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
          const result = await this.modelCatalogService.refreshProvider(
            message.payload.providerId
          );

          await this.postMessage({
            type: "providerModelsUpdated",
            payload: result
          });

          return;
        }

        case "probeProvider": {
          const result = await this.modelCatalogService.probeProvider(
            message.payload.providerId
          );

          await this.postMessage({
            type: "providerProbeResult",
            payload: {
              providerId: message.payload.providerId,
              ...result
            }
          });

          return;
        }

        default: {
          const unreachable: never = message;
          throw new Error(`Unsupported webview message: ${JSON.stringify(unreachable)}`);
        }
      }
    } catch (error) {
      await this.postMessage({
        type: "error",
        payload: {
          requestType: message.type,
          message: getErrorMessage(error)
        }
      });
    }
  }

  private async postMessage(message: WebviewResponse): Promise<void> {
    await this.webviewView?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "webview.ui", "dist", "assets", "index.js")
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "webview.ui", "dist", "assets", "index.css")
    );

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode",
        "codicons",
        "dist",
        "codicon.css"
      )
    );

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

function getNonce(): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for (let index = 0; index < 32; index++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}