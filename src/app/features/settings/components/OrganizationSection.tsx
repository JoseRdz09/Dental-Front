
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { updateOrganization } from "../services/organizationService";

import "../css/OrganizationSection.css";

interface OrganizationSectionProps {
  organizationId: number;
  organizationName: string;
  logoUrl?: string | null;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionRenewalDate?: string | null;
  subscriptionCheckoutUrl?: string | null;
}

export default function OrganizationSection({
  organizationId,
  organizationName,
  logoUrl,
  subscriptionStatus = "Pendiente",
  subscriptionPlan = "Sin plan contratado",
  subscriptionRenewalDate,
  subscriptionCheckoutUrl,
}: OrganizationSectionProps) {
  const [name, setName] = useState(organizationName);
  const [logo, setLogo] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(
    logoUrl ?? null
  );
  const [preview, setPreview] = useState<string | null>(logoUrl ?? null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(organizationName);
  }, [organizationName]);

  useEffect(() => {
    setCurrentLogoUrl(logoUrl ?? null);
  }, [logoUrl]);

  useEffect(() => {
    if (!logo) {
      setPreview(removeLogo ? null : currentLogoUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(logo);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logo, currentLogoUrl, removeLogo]);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Selecciona una imagen JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2 MB.");
      event.target.value = "";
      return;
    }

    setLogo(file);
    setRemoveLogo(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre de la organización es obligatorio.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("_method", "PUT");
      formData.append("name", name.trim());

      if (logo) {
        formData.append("logo_file", logo);
      }

      if (removeLogo) {
        formData.append("remove_logo", "1");
      }

      const response = await updateOrganization(organizationId, formData);

      setName(response.organization.name);
      setCurrentLogoUrl(response.organization.logo_url);
      setLogo(null);
      setRemoveLogo(false);

      toast.success(response.message);
    } catch (error) {
      console.error("Error al actualizar organización:", error);
      toast.error("No fue posible actualizar la organización.");
    } finally {
      setSaving(false);
    }
  }

  function handleRemoveLogo() {
    setLogo(null);
    setRemoveLogo(true);
  }

  const hasChanges =
    name.trim() !== organizationName ||
    logo !== null ||
    removeLogo;

  const normalizedStatus = subscriptionStatus.toLowerCase();

  const isActive = normalizedStatus === "activa";

  const renewalDate = subscriptionRenewalDate
    ? new Date(subscriptionRenewalDate).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "No disponible";

  return (
    <div className="organization-settings-grid">

      {/* CARD: ORGANIZACIÓN */}
      <article className="settings-card organization-card">

        <div className="settings-card__heading">
          <div className="settings-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 21h18M5 21V7l7-4 7 4v14" />
              <path d="M9 21v-6h6v6M9 9h.01M15 9h.01" />
            </svg>
          </div>

          <div>
            <h2>Datos de la organización</h2>
            <p>
              Administra la información y la imagen de tu organización.
            </p>
          </div>
        </div>

        <form className="organization-form" onSubmit={handleSubmit}>

          <div className="organization-form__logo-section">
            <div className="organization-form__logo">
              {preview ? (
                <img src={preview} alt="Logo de la organización" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-6h6v6" />
                </svg>
              )}
            </div>

            <div className="organization-form__logo-info">
              <strong>Logo de la organización</strong>

              <p>
                Imagen JPG, PNG o WEBP.
                <br />
                Tamaño máximo de 2 MB.
              </p>

              <div className="organization-form__logo-actions">
                <label
                  htmlFor="organization-logo"
                  className="organization-form__upload"
                >
                  Cambiar imagen
                </label>

                <input
                  id="organization-logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  hidden
                />

                {preview && (
                  <button
                    type="button"
                    className="organization-form__remove"
                    onClick={handleRemoveLogo}
                    disabled={saving}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="organization-form__divider" />

          <div className="organization-form__field">
            <label htmlFor="organization-name">
              Nombre de la organización
            </label>

            <input
              id="organization-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre de tu organización"
              maxLength={150}
              required
              disabled={saving}
            />

            <small>
              Este nombre identifica a tu organización dentro de la plataforma.
            </small>
          </div>

          <div className="organization-form__footer">
            <button
              type="submit"
              disabled={saving || !name.trim() || !hasChanges}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

        </form>
      </article>

      {/* CARD: SUSCRIPCIÓN */}
      <article className="settings-card subscription-card">

        <div className="subscription-card__top">
          <div className="subscription-card__heading">
            <div className="subscription-card__icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20M6 15h4" />
              </svg>
            </div>

            <div>
              <h2>Suscripción y pagos</h2>
              <p>
                Consulta y administra tu plan de servicio.
              </p>
            </div>
          </div>

          <span
            className={`subscription-card__badge ${
              isActive ? "is-active" : "is-pending"
            }`}
          >
            <span />
            {subscriptionStatus}
          </span>
        </div>

        <div className="subscription-card__plan">
          <span>PLAN ACTUAL</span>
          <h3>{subscriptionPlan}</h3>
          <p>
            Plan contratado para tu organización.
          </p>
        </div>

        <div className="subscription-card__details">

          <div className="subscription-card__detail">
            <div className="subscription-card__detail-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
            </div>

            <div>
              <span>Próxima renovación</span>
              <strong>{renewalDate}</strong>
            </div>
          </div>

          <div className="subscription-card__detail">
            <div className="subscription-card__detail-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>

            <div>
              <span>Estado del servicio</span>
              <strong>{subscriptionStatus}</strong>
            </div>
          </div>

        </div>

        <div className="subscription-card__footer">
          <div>
            <strong>Gestiona tu suscripción</strong>
            <p>
              Continúa al proceso de pago para activar o renovar tu servicio.
            </p>
          </div>

          <button
            type="button"
            disabled={!subscriptionCheckoutUrl}
            onClick={() => {
              if (subscriptionCheckoutUrl) {
                window.location.assign(subscriptionCheckoutUrl);
              }
            }}
          >
            Pagar suscripción
            <span>→</span>
          </button>
        </div>

        {!subscriptionCheckoutUrl && (
          <small className="subscription-card__notice">
            El servicio de pagos todavía no está configurado.
          </small>
        )}

      </article>

    </div>
  );
}
