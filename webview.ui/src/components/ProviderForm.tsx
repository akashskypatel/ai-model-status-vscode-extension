import { useEffect, useState } from "react";
import type {
  ProviderAuthKind,
  ProviderConfig,
  ProviderInput,
  ProviderType
} from "../types";

type ProviderFormProps = {
  provider?: ProviderConfig;
  error?: string;
  onAddProvider(input: ProviderInput): void;
  onUpdateProvider(providerId: string, input: ProviderInput): void;
  onCancel(): void;
};

export function ProviderForm({
  provider,
  error,
  onAddProvider,
  onUpdateProvider,
  onCancel
}: ProviderFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ProviderType>("openai-compatible");
  const [endpoint, setEndpoint] = useState("");
  const [authKind, setAuthKind] = useState<ProviderAuthKind>("api-key");
  const [apiKey, setApiKey] = useState("");
  const [localError, setLocalError] = useState<string | undefined>();
  const [maxRequestsPerMinute, setMaxRequestsPerMinute] = useState("");

  const isEditing = Boolean(provider);

  useEffect(() => {
    setName(provider?.name ?? "");
    setType(provider?.type ?? "openai-compatible");
    setEndpoint(provider?.endpoint ?? "");
    setAuthKind(provider?.authKind ?? "api-key");
    setApiKey("");
    setMaxRequestsPerMinute(
      provider?.maxRequestsPerMinute !== undefined
        ? String(provider.maxRequestsPerMinute)
        : ""
    );
    setLocalError(undefined);
  }, [provider]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const input = readProviderInput();

    if (!input) {
      return;
    }

    if (provider) {
      onUpdateProvider(provider.id, input);
    } else {
      onAddProvider(input);
    }
  }

  function readProviderInput(): ProviderInput | undefined {
    const trimmedName = name.trim();
    const trimmedEndpoint = endpoint.trim();
    const trimmedApiKey = apiKey.trim();
    const parsedMaxRequestsPerMinute =
      maxRequestsPerMinute.trim().length > 0
        ? Number(maxRequestsPerMinute)
        : undefined;
    setLocalError(undefined);
    if (
      parsedMaxRequestsPerMinute !== undefined &&
      (!Number.isFinite(parsedMaxRequestsPerMinute) || parsedMaxRequestsPerMinute <= 0)
    ) {
      setLocalError("Max Requests Per Minute must be greater than 0.");
      return undefined;
    }

    if (!trimmedName) {
      setLocalError("Provider name is required.");
      return undefined;
    }

    if (!trimmedEndpoint) {
      setLocalError("API endpoint is required.");
      return undefined;
    }

    if (!isValidHttpUrl(trimmedEndpoint)) {
      setLocalError("API endpoint must be a valid http or https URL.");
      return undefined;
    }

    if (authKind === "api-key" && !trimmedApiKey && !isEditing) {
      setLocalError("API key is required when authentication is set to API key.");
      return undefined;
    }

    return {
      name: trimmedName,
      type,
      endpoint: trimmedEndpoint,
      authKind,
      apiKey:
        authKind === "api-key" && trimmedApiKey
          ? trimmedApiKey
          : undefined,
      maxRequestsPerMinute:
        parsedMaxRequestsPerMinute !== undefined
          ? Math.floor(parsedMaxRequestsPerMinute)
          : undefined
    };
  }

  const displayedError = localError ?? error;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{isEditing ? "Edit API Provider" : "Add API Provider"}</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Close"
          onClick={onCancel}
        >
          ×
        </button>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Provider name</span>
          <input
            type="text"
            placeholder="OpenAI, LM Studio, OpenRouter"
            autoComplete="off"
            required
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Provider type</span>
          <select
            value={type}
            onChange={event => setType(event.target.value as ProviderType)}
          >
            <option value="openai-compatible">OpenAI-compatible</option>
          </select>
        </label>

        <label className="field">
          <span>API endpoint</span>
          <input
            type="url"
            placeholder="https://api.openai.com or http://localhost:1234"
            autoComplete="off"
            required
            value={endpoint}
            onChange={event => setEndpoint(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Authentication</span>
          <select
            value={authKind}
            onChange={event => setAuthKind(event.target.value as ProviderAuthKind)}
          >
            <option value="api-key">API key</option>
            <option value="none">No authentication</option>
          </select>
        </label>

        <label className="field">
          <span>Max Requests Per Minute</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Optional, e.g. 60"
            value={maxRequestsPerMinute}
            onChange={event => setMaxRequestsPerMinute(event.target.value)}
          />
        </label>

        {authKind === "api-key" && (
          <label className="field">
            <span>API key</span>
            <input
              type="password"
              placeholder={isEditing ? "Leave blank to keep existing key" : "sk-..."}
              autoComplete="off"
              value={apiKey}
              onChange={event => setApiKey(event.target.value)}
            />
          </label>
        )}

        <p className="help-text">
          API keys are sent to the extension host and stored using VS Code SecretStorage.
        </p>

        {displayedError && <div className="error">{displayedError}</div>}

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            {isEditing ? "Save Changes" : "Add Provider"}
          </button>
        </div>
      </form>
    </section>
  );
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}