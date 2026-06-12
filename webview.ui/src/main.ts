import "./style.css";

type ProviderType = "openai-compatible";
type ProviderAuthKind = "api-key" | "none";

type ProviderInput = {
  name: string;
  type: ProviderType;
  endpoint: string;
  authKind: ProviderAuthKind;
  apiKey?: string;
};

type ProviderConfig = {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  authKind: ProviderAuthKind;
  createdAt?: string;
  updatedAt?: string;
};

let providers: ProviderConfig[] = [];
let editingProviderId: string | undefined;

type VsCodeApi = {
  postMessage(message: unknown): void;
};

declare const acquireVsCodeApi: () => VsCodeApi;

const vscode = acquireVsCodeApi();

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found.");
}

root.innerHTML = `
  <main class="app">
    <section id="provider-form-panel" class="panel hidden">
      <div class="panel-header">
        <h2 id="provider-form-title">Add API Provider</h2>
        <button id="close-provider-form" class="icon-button" type="button" aria-label="Close">
          ×
        </button>
      </div>

      <form id="provider-form" class="form">
        <label class="field">
          <span>Provider name</span>
          <input
            id="provider-name"
            type="text"
            placeholder="OpenAI, LM Studio, OpenRouter"
            autocomplete="off"
            required
          />
        </label>

        <label class="field">
          <span>Provider type</span>
          <select id="provider-type">
            <option value="openai-compatible">OpenAI-compatible</option>
          </select>
        </label>

        <label class="field">
          <span>API endpoint</span>
          <input
            id="provider-endpoint"
            type="url"
            placeholder="https://api.openai.com or http://localhost:1234"
            autocomplete="off"
            required
          />
        </label>

        <label class="field">
          <span>Authentication</span>
          <select id="provider-auth-kind">
            <option value="api-key">API key</option>
            <option value="none">No authentication</option>
          </select>
        </label>

        <label id="api-key-field" class="field">
          <span>API key</span>
          <input
            id="provider-api-key"
            type="password"
            placeholder="sk-..."
            autocomplete="off"
          />
        </label>

        <p class="help-text">
          API keys are sent to the extension host and should be stored using VS Code SecretStorage.
        </p>

        <div id="form-error" class="error hidden"></div>

        <div class="form-actions">
          <button id="cancel-provider-form" type="button" class="secondary-button">
            Cancel
          </button>
          <button id="provider-form-submit" type="submit" class="primary-button">
            Add Provider
          </button>
        </div>
      </form>
    </section>

    <section class="panel">
      <h2>Providers</h2>
      <div id="providers-empty" class="empty">
        No providers added yet. Use the + button in the view title.
      </div>
      <ul id="provider-list" class="list"></ul>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Models</h2>
        <button id="refresh-models" type="button" class="secondary-button">
          Refresh
        </button>
      </div>
      <pre id="output">Loading...</pre>
    </section>
  </main>
`;

const providerFormPanel = getElement("provider-form-panel");
const providerForm = getElement("provider-form") as HTMLFormElement;
const closeProviderFormButton = getElement("close-provider-form");
const cancelProviderFormButton = getElement("cancel-provider-form");
const refreshModelsButton = getElement("refresh-models");
const providerAuthKindInput = getElement("provider-auth-kind") as HTMLSelectElement;
const apiKeyField = getElement("api-key-field");
const formError = getElement("form-error");
const output = getElement("output");
const providerList = getElement("provider-list");
const providersEmpty = getElement("providers-empty");
const providerFormTitle = getElement("provider-form-title");
const providerFormSubmit = getElement("provider-form-submit");

closeProviderFormButton.addEventListener("click", () => {
  resetProviderForm();
  hideProviderForm();
});

cancelProviderFormButton.addEventListener("click", () => {
  resetProviderForm();
  hideProviderForm();
});

refreshModelsButton.addEventListener("click", () => {
  vscode.postMessage({
    type: "refreshModels"
  });
});

providerAuthKindInput.addEventListener("change", () => {
  const authKind = getProviderAuthKind();

  apiKeyField.classList.toggle("hidden", authKind === "none");
});

providerForm.addEventListener("submit", event => {
  event.preventDefault();

  const input = readProviderInput();

  if (!input) {
    return;
  }

  if (editingProviderId) {
    vscode.postMessage({
      type: "updateProvider",
      payload: {
        providerId: editingProviderId,
        input
      }
    });
  } else {
    vscode.postMessage({
      type: "addProvider",
      payload: input
    });
  }

  resetProviderForm();
  hideProviderForm();
});

window.addEventListener("message", event => {
  const message = event.data;

  switch (message.type) {
    case "showAddProvider":
      showAddProviderForm();
      break;

    case "providersUpdated":
      renderProviders(message.payload);
      break;

    case "modelSnapshotUpdated":
    case "providerModelsUpdated":
    case "providerProbeResult":
      output.textContent = JSON.stringify(message.payload, null, 2);
      break;

    case "error":
      showError(message.payload?.message ?? "Unknown error.");
      output.textContent = JSON.stringify(message.payload, null, 2);
      break;

    default:
      output.textContent = JSON.stringify(message, null, 2);
      break;
  }
});

vscode.postMessage({
  type: "ready"
});

function showAddProviderForm(): void {
  const apiKeyInput = getElement("provider-api-key") as HTMLInputElement;
  apiKeyInput.placeholder = "sk-...";
  editingProviderId = undefined;

  providerForm.reset();
  clearFormError();

  providerFormTitle.textContent = "Add API Provider";
  providerFormSubmit.textContent = "Add Provider";
  apiKeyField.classList.remove("hidden");

  showProviderForm();

  const nameInput = getElement("provider-name") as HTMLInputElement;
  nameInput.focus();
}

function showEditProviderForm(providerId: string): void {
  const provider = providers.find(item => item.id === providerId);
  const apiKeyInput = getElement("provider-api-key") as HTMLInputElement;
  apiKeyInput.placeholder = "Leave blank to keep existing key";
  if (!provider) {
    showError(`Provider not found: ${providerId}`);
    return;
  }

  editingProviderId = provider.id;
  clearFormError();

  providerFormTitle.textContent = "Edit API Provider";
  providerFormSubmit.textContent = "Save Changes";

  setInputValue("provider-name", provider.name);
  setInputValue("provider-type", provider.type);
  setInputValue("provider-endpoint", provider.endpoint);
  setInputValue("provider-auth-kind", provider.authKind);
  setInputValue("provider-api-key", "");

  apiKeyField.classList.toggle("hidden", provider.authKind === "none");

  showProviderForm();

  const nameInput = getElement("provider-name") as HTMLInputElement;
  nameInput.focus();
}

function showProviderForm(): void {
  providerFormPanel.classList.remove("hidden");
}

function hideProviderForm(): void {
  providerFormPanel.classList.add("hidden");
  clearFormError();
}

function resetProviderForm(): void {
  editingProviderId = undefined;
  providerForm.reset();
  providerFormTitle.textContent = "Add API Provider";
  providerFormSubmit.textContent = "Add Provider";
  apiKeyField.classList.remove("hidden");
  clearFormError();
}

function hideAddProviderForm(): void {
  providerFormPanel.classList.add("hidden");
  clearFormError();
}

function readProviderInput(): ProviderInput | undefined {
  clearFormError();

  const name = getInputValue("provider-name");
  const endpoint = getInputValue("provider-endpoint");
  const type = getProviderType();
  const authKind = getProviderAuthKind();
  const apiKey = getInputValue("provider-api-key");

  if (!name) {
    showFormError("Provider name is required.");
    return undefined;
  }

  if (!endpoint) {
    showFormError("API endpoint is required.");
    return undefined;
  }

  if (!isValidHttpUrl(endpoint)) {
    showFormError("API endpoint must be a valid http or https URL.");
    return undefined;
  }

  if (authKind === "api-key" && !apiKey && !editingProviderId) {
    showFormError("API key is required when authentication is set to API key.");
    return undefined;
  }

  return {
    name,
    type,
    endpoint,
    authKind,
    apiKey: authKind === "api-key" && apiKey ? apiKey : undefined
  };
}

function renderProviders(payload: unknown): void {
  if (!Array.isArray(payload)) {
    return;
  }

  providers = payload.filter(isProviderConfig);

  providerList.innerHTML = "";

  providersEmpty.classList.toggle("hidden", providers.length > 0);

  for (const provider of providers) {
    const item = document.createElement("li");
    item.className = "list-item provider-card";

    const content = document.createElement("div");
    content.className = "provider-card-content";

    const name = document.createElement("strong");
    name.textContent = provider.name;

    const endpoint = document.createElement("span");
    endpoint.className = "muted";
    endpoint.textContent = provider.endpoint;

    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `${provider.type} · ${provider.authKind}`;

    content.append(name, endpoint, meta);

    const actions = document.createElement("div");
    actions.className = "provider-card-actions";

    const editButton = document.createElement("button");
    editButton.className = "secondary-button compact-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      showEditProviderForm(provider.id);
    });

    actions.append(editButton);

    item.append(content, actions);
    providerList.appendChild(item);
  }
}

function getProviderType(): ProviderType {
  const value = getInputValue("provider-type");

  if (value === "openai-compatible") {
    return value;
  }

  return "openai-compatible";
}

function getProviderAuthKind(): ProviderAuthKind {
  const value = getInputValue("provider-auth-kind");

  if (value === "none") {
    return "none";
  }

  return "api-key";
}

function getInputValue(id: string): string {
  const element = getElement(id) as HTMLInputElement | HTMLSelectElement;
  return element.value.trim();
}

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Element not found: ${id}`);
  }

  return element;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function showFormError(message: string): void {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function clearFormError(): void {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function showError(message: string): void {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function isProviderConfig(value: unknown): value is ProviderConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const provider = value as Partial<ProviderConfig>;

  return (
    typeof provider.id === "string" &&
    typeof provider.name === "string" &&
    provider.type === "openai-compatible" &&
    typeof provider.endpoint === "string" &&
    (provider.authKind === "api-key" || provider.authKind === "none")
  );
}

function setInputValue(id: string, value: string): void {
  const element = getElement(id) as HTMLInputElement | HTMLSelectElement;
  element.value = value;
}