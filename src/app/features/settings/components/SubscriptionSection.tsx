
export default function SubscriptionSection() {
  return (
    <article className="settings-card subscription-card">
      <div className="settings-card__heading">
        <div className="settings-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M3 10h18M7 15h4" />
          </svg>
        </div>

        <div>
          <h2>Mi suscripción</h2>
          <p>Consulta y administra tu plan de servicio.</p>
        </div>
      </div>

      <div className="subscription-placeholder">
        <div className="subscription-placeholder__icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3v18M3 12h18" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>

        <h3>Tu suscripción, en un solo lugar</h3>

        <p>
          Próximamente podrás consultar tu plan, revisar sus beneficios
          y administrar tu facturación desde aquí.
        </p>

        <span className="subscription-placeholder__badge">
          Disponible próximamente
        </span>
      </div>
    </article>
  );
}
