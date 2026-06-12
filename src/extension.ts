import * as vscode from "vscode";
import { ModelStatusViewProvider } from "./ModelStatusViewProvider";

export function activate(context: vscode.ExtensionContext): void {
  const modelStatusViewProvider = new ModelStatusViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ModelStatusViewProvider.viewType,
      modelStatusViewProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("aiModelStatus.addProvider", async () => {
      await modelStatusViewProvider.showAddProvider();
    }),

    vscode.commands.registerCommand("aiModelStatus.openSettings", async () => {
      await modelStatusViewProvider.showSettings();
    }),

    vscode.commands.registerCommand("aiModelStatus.refreshModels", async () => {
      await modelStatusViewProvider.refreshModels();
    })
  );
}

export function deactivate(): void {}