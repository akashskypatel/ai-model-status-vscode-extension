# AI Model Status

A Visual Studio Code extension for monitoring and tracking the health status of AI models across different providers. Test connectivity, view availability status, and get detailed error information for your LLM endpoints.

## Features

### Provider Management

- **Add OpenAI-Compatible Providers**: Configure any OpenAI-compatible API endpoint (OpenAI, Mistral, Anthropic, local servers, etc.)
- **API Key Configuration**: Securely store API keys for each provider using VS Code's secret storage
- **Multiple Providers**: Manage multiple providers simultaneously
- **Rate Limiting**: Configure max requests per minute for each provider

### Model Discovery

- **Automatic Model Listing**: Automatically fetches all available models from each provider
- **Model Categorization**: Models are grouped by type (chat, embedding, image, audio, reranker, completion, unknown)
- **Filter Models**: Search and filter models by name, ID, or type using the filter bar

### Health Monitoring

- **Ping Individual Models**: Test connectivity to a specific model with one click
- **Ping All Provider Models**: Refresh and check all models from a provider simultaneously
- **Refresh All Models**: Fetch latest model lists from all providers

### Status Tracking

- **Availability Status**: Each model shows its connectivity status (available, unavailable, unknown)
- **Visual Indicators**: Color-coded status pills (green for available, red for unavailable)
- **Progress Tracking**: When refreshing a provider, see real-time progress showing `X/Y models pinged (Z%)`
- **Persistent Status**: Model availability status is saved and restored across VS Code sessions

### Detailed Information

- **Last Checked Timestamp**: Hover over a model's status pill to see when it was last pinged
- **HTTP Status Codes**: For unavailable models, the tooltip shows the specific HTTP error (e.g., "401 Unauthorized", "404 Not Found", "429 Too Many Requests")
- **Error Messages**: View detailed error messages for failed connectivity checks
- **Model Metadata**: See model type and owner information

### User Experience

- **Copy Model Names**: One-click copy of model names to clipboard with VS Code notification confirmation
- **Side Bar Integration**: Accessible via the Activity Bar with a dedicated icon
- **Responsive UI**: Clean, organized interface with collapsible provider sections

## Requirements

- Visual Studio Code 1.110.0 or higher
- Node.js 20.x or higher (for development)

## Installation

### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "AI Model Status"
4. Click Install

### From VSIX Package

1. Download the `.vsix` file from releases
2. In VS Code, go to Extensions view
3. Click the ... menu and select "Install from VSIX..."
4. Select the downloaded `.vsix` file

### From Source

1. Clone this repository
2. Run `pnpm install`
3. Run `pnpm run build`
4. Press F5 to launch the Extension Development Host window

## Usage

### Adding a Provider

1. Click the "AI Models" icon in the Activity Bar to open the extension
2. Click the "+" button or use the "Add Provider" command
3. Fill in the provider details:
   - **Name**: A friendly name for the provider (e.g., "OpenAI", "Mistral", "Local")
   - **Type**: Currently only "openai-compatible" is supported
   - **Endpoint**: The base URL of the API (e.g., `https://api.openai.com/v1`, `https://mistral.ai/api/v1`)
   - **API Key**: Your API key for authentication (stored securely)
   - **Rate Limit**: Optional max requests per minute
4. Click Save

### Checking Model Connectivity

- **Ping a single model**: Click the refresh icon next to any model name
- **Ping all models from a provider**: Click the refresh icon in the provider header
- **Refresh all providers**: Use the "Refresh Models" command from the panel menu

### Viewing Status Details

- Hover over any status pill (available/unavailable) to see:
  - Last checked timestamp
  - Connectivity status
  - HTTP status code and description (for unavailable models)

### Copying Model Names

- Click the copy icon next to any model name to copy it to your clipboard
- A VS Code notification will confirm the copy

## Commands

| Command | Description |
|---------|-------------|
| `AI Model Status: Add OpenAI-Compatible Provider` | Open form to add a new provider |
| `Add Provider` | Add a new provider (available in panel) |
| `Settings` | Open extension settings (not yet implemented) |
| `Refresh Models` | Refresh all models from all providers |

## Provider Types

Currently supports:

- **OpenAI-Compatible**: Any provider using the OpenAI API format, including:
  - OpenAI
  - Mistral AI
  - Anthropic (via Bedrock or direct)
  - Local/self-hosted LLM servers (e.g., Ollama, vLLM, LocalAI)
  - Any custom OpenAI-compatible endpoint

## Model Types

The extension categorizes models into the following types:

- `chat` - Chat/completion models
- `embedding` - Embedding models
- `image` - Image generation models
- `audio` - Audio transcription/synthesis models
- `reranker` - Reranking models
- `completion` - Text completion models
- `unknown` - Models with unidentified types

## Development

### Prerequisites

- Node.js 20.x or higher
- pnpm (recommended) or npm/yarn
- Visual Studio Code 1.110.0 or higher

### Setup

```bash
# Install dependencies
pnpm install

# Build the extension and webview
pnpm run build
```

### Running the Extension

1. Open this folder in Visual Studio Code
2. Press `F5` to launch the Extension Development Host window
3. A new VS Code window will open with the extension loaded
4. Open the AI Models view from the Activity Bar

### Packaging

Create a VSIX package for manual installation:

```bash
# Build and package
pnpm run package
```

The `.vsix` file will be created in the project root.

For CI/CD environments:

```bash
# Build and package with explicit output
pnpm run package:ci
```

This creates `ai-model-status.vsix` in the project root.

### Publishing

Publish to the VS Code Marketplace:

```bash
# Publish using vsce
pnpm run publish
```

Or use ovsx for more publishing options:

```bash
# Publish using ovsx
pnpm run publish:ovsx
```

Note: You need to:
1. Install `vsce` globally: `pnpm add -g vsce`
2. Create a publisher account at https://marketplace.visualstudio.com/manage
3. Add your publisher name to `package.json`

## Project Structure

```
ai-model-status/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── ModelStatusViewProvider.ts # Webview provider
│   ├── services/
│   │   └── ModelCatalogService.ts # Model fetching and pinging
│   ├── storage/
│   │   ├── ProviderStore.ts       # Provider storage
│   │   └── ModelStore.ts          # Model snapshot storage
│   ├── providers/
│   │   ├── AIProviderClient.ts    # Provider client interface
│   │   ├── OpenAICompatibleClient.ts # OpenAI-compatible implementation
│   │   └── ProviderClientFactory.ts # Client factory
│   └── domain/
│       ├── types.ts              # Type definitions
│       ├── messages.ts            # Message types
│       ├── constants.ts           # Constants
│       └── errors.ts              # Error handling
├── webview.ui/
│   ├── src/
│   │   ├── components/
│   │   │   └── ModelOutput.tsx    # Main React component
│   │   ├── App.tsx                # Webview app
│   │   ├── vscodeApi.ts           # VS Code API bridge
│   │   └── types.ts               # Webview types
│   └── dist/                      # Compiled webview (generated)
├── resources/
│   └── icon.svg                  # Extension icon
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
└── .vscodeignore                 # VSIX packaging ignore rules
```

## Data Storage

The extension stores data securely using VS Code's storage APIs:

- **Providers**: Stored in globalState with encrypted API keys in secrets storage
- **Model Snapshots**: Persisted in globalState to maintain connectivity status across sessions
- **Ping History**: Each model's last ping timestamp, status code, and error message are preserved

## Known Limitations

- Currently only supports OpenAI-compatible providers
- Settings UI is not yet implemented
- No automatic periodic refresh (manual refresh only)
- No custom categories for models

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License

---

**Enjoy monitoring your AI models!**
