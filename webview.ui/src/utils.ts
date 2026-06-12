export function getModelPingKey(providerId: string, modelId: string): string {
  return `${providerId}:${modelId}`;
}
