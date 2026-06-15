import * as vscode from "vscode";
import type { ModelCatalogSnapshot } from "../domain/types";

const MODEL_SNAPSHOT_KEY = "aiModelStatus.modelSnapshot";

export class ModelStore {
  constructor(private readonly context: vscode.ExtensionContext) { }

  async getSnapshot(): Promise<ModelCatalogSnapshot | undefined> {
    return this.context.globalState.get<ModelCatalogSnapshot>(MODEL_SNAPSHOT_KEY);
  }

  async saveSnapshot(snapshot: ModelCatalogSnapshot): Promise<void> {
    await this.context.globalState.update(MODEL_SNAPSHOT_KEY, snapshot);
  }

  async clearSnapshot(): Promise<void> {
    await this.context.globalState.update(MODEL_SNAPSHOT_KEY, undefined);
  }
}
