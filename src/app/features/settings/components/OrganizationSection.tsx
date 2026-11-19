
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

  // Sincronizar información recibida desde AuthProvider.
  useEffect(() => {
    setName(organizationName);
  }, [organizationName]);

  useEffect(() => {
    setCurrentLogoUrl(logoUrl ?? null);
  }, [logoUrl]);

  // Generar previsualización de la imagen seleccionada.
  useEffect(() => {
    if (!logo) {
      setPreview(removeLogo ? null : currentLogoUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(logo);

    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logo, currentLogoUrl, removeLogo]);

  function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
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

      const response = await updateOrganization(
        organizationId,
        formData
      );

      // Actualizar información local.
      setName(response.organization.name);
      setCurrentLogoUrl(response.organization.logo_url);
      setLogo(null);
      setRemoveLogo(false);

      toast.success(response.message);

    } catch (error) {
      console.error("Error al actualizar organización:", error);

      toast.error(
        "No fue posible actualizar la organización."
      );
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

  return (
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

      <form
        className="organization-form"
        onSubmit={handleSubmit}
      >
        <div className="organization-form__logo-section">
          <div className="organization-form__logo">
            {preview ? (
              <img
                src={preview}
                alt="Logo de la organización"
              />
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
              Utiliza una imagen JPG, PNG o WEBP.
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

      {/* SUSCRIPCIÓN */}
      <div className="organization-subscription">
        <div className="organization-subscription__heading">
          <div className="organization-subscription__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20M6 15h4" />
            </svg>
          </div>

          <div>
            <h3>Suscripción y pagos</h3>
            <p>
              Administra tu plan y los pagos de tu organización.
            </p>
          </div>
        </div>

        <div className="organization-subscription__details">
          <div className="organization-subscription__item">
            <span>Plan actual</span>
            <strong>{subscriptionPlan}</strong>
          </div>

          <div className="organization-subscription__item">
            <span>Estado</span>
            <strong
              className={`organization-subscription__status ${
                subscriptionStatus.toLowerCase() === "activa"
                  ? "is-active"
                  : "is-pending"
              }`}
            >
              {subscriptionStatus}
            </strong>
          </div>

          <div className="organization-subscription__item">
            <span>Próxima renovación</span>
            <strong>
              {subscriptionRenewalDate
                ? new Date(subscriptionRenewalDate).toLocaleDateString(
                    "es-MX",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "No disponible"}
            </strong>
          </div>
        </div>

        <div className="organization-subscription__footer">
          <div>
            <strong>Gestiona tu suscripción</strong>
            <p>
              Consulta tu plan y continúa al proceso de pago
              para activar o renovar tu servicio.
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
          </button>
        </div>

        {!subscriptionCheckoutUrl && (
          <small className="organization-subscription__notice">
            El servicio de pagos todavía no está configurado.
          </small>
        )}
      </div>
    </article>
  );
}
