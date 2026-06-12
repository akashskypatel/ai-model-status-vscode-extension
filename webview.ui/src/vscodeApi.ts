import type { WebviewMessage } from "./types";

type VsCodeApi = {
  postMessage(message: WebviewMessage): void;
};

declare const acquireVsCodeApi: () => VsCodeApi;

export const vscode = acquireVsCodeApi();