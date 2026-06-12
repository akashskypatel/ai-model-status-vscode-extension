type ModelOutputProps = {
  output: unknown;
  onRefreshModels(): void;
};

export function ModelOutput({ output, onRefreshModels }: ModelOutputProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Models</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={onRefreshModels}
        >
          Refresh
        </button>
      </div>

      <pre>
        {typeof output === "string"
          ? output
          : JSON.stringify(output, null, 2)}
      </pre>
    </section>
  );
}