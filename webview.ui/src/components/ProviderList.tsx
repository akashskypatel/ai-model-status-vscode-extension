import type { ProviderConfig } from "../types";

type ProviderListProps = {
  providers: ProviderConfig[];
  onEditProvider(provider: ProviderConfig): void;
};

export function ProviderList({ providers, onEditProvider }: ProviderListProps) {
  return (
    <section className="panel">
      <h2>Providers</h2>

      {providers.length === 0 && (
        <div className="empty">
          No providers added yet. Use the + button in the view title.
        </div>
      )}

      {providers.length > 0 && (
        <ul className="list">
          {providers.map(provider => (
            <li key={provider.id} className="list-item provider-card">
              <div className="provider-card-content">
                <strong>{provider.name}</strong>
                <span className="muted">{provider.endpoint}</span>
                <span className="muted">
                  {provider.type} · {provider.authKind}
                </span>
              </div>

              <div className="provider-card-actions">
                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={() => onEditProvider(provider)}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}