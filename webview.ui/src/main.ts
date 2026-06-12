import "./style.css";

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
  <main>
    <h1>AI Model Status</h1>

    <section>
      <button id="refresh-models">Refresh Models</button>
    </section>

    <section>
      <h2>Output</h2>
      <pre id="output">Loading...</pre>
    </section>
  </main>
`;

const output = document.getElementById("output");

document.getElementById("refresh-models")?.addEventListener("click", () => {
  vscode.postMessage({
    type: "refreshModels"
  });
});

window.addEventListener("message", event => {
  const message = event.data;

  switch (message.type) {
    case "showAddProvider":
      // Open your add-provider form/modal/view.
      console.log("Show add provider UI");
      break;

    case "showSettings":
      // Open your settings UI.
      console.log("Show settings UI");
      break;

    default:
      if (output) {
        output.textContent = JSON.stringify(message, null, 2);
      }
      break;
  }
});

vscode.postMessage({
  type: "ready"
});