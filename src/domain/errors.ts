import type { ProviderStatus } from "./types";

export class ProviderRequestError extends Error {
  constructor(
    message: string,
    public readonly status: ProviderStatus,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ProviderRequestError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}