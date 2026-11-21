
import { useEffect, useRef, useState } from "react";
import { Plus, Building2, ChevronDown, Check } from "lucide-react";

import Treatments from "../components/Treatment";
import CreateTreatmentModal from "../components/CreateTreatmentModal";
import { useClinicTeam } from "../../clinical-team/hooks/useClinicTeam";

import "../css/TreatmentsPage.css";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

export default function TreatmentsPage() {
  const {
    clinics,
    clinicId,
    setClinicId,
    clinicsLoading,
  } = useClinicTeam();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isClinicMenuOpen, setIsClinicMenuOpen] = useState(false);

  const clinicSelectorRef = useRef<HTMLDivElement>(null);

  const selectedClinic = clinics.find(
    (clinic) => Number(clinic.id) === Number(clinicId)
  );

  // Cerrar dropdown al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isClinicMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        clinicSelectorRef.current &&
        !clinicSelectorRef.current.contains(event.target as Node)
      ) {
        setIsClinicMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsClinicMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isClinicMenuOpen]);

  const handleClinicChange = (id: number) => {
    setIsCreateModalOpen(false);
    setClinicId(id);
    setIsClinicMenuOpen(false);
  };

  if (clinicsLoading) {
    return (
      <div className="treatments-page">
        <div className="treatments-page__state">
          < LoadingScreen />
        </div>
      </div>
    );
  }

  if (!clinics.length) {
    return (
      <div className="treatments-page">
        <div className="treatments-page__state treatments-page__state--empty">
          <p>No hay clínicas disponibles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="treatments-page">
      <h1>Tratamientos</h1>
      
      <div className="treatments-page__toolbar">

        <div className="treatments-page__selector">
          <label className="treatments-page__label">
            Seleccionar clínica
          </label>

          <div
            className="clinic-dropdown"
            ref={clinicSelectorRef}
          >
            <button
              type="button"
              className={`clinic-dropdown__trigger ${
                isClinicMenuOpen ? "clinic-dropdown__trigger--open" : ""
              }`}
              onClick={() => setIsClinicMenuOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isClinicMenuOpen}
            >
              <span className="clinic-dropdown__icon">
                <Building2 size={20} />
              </span>

              <span className="clinic-dropdown__selected">
                <span className="clinic-dropdown__selected-label">
                  Clínica seleccionada
                </span>

                <span className="clinic-dropdown__selected-name">
                  {selectedClinic?.name ?? "Selecciona una clínica"}
                </span>
              </span>

              <ChevronDown
                size={19}
                className={`clinic-dropdown__arrow ${
                  isClinicMenuOpen ? "clinic-dropdown__arrow--open" : ""
                }`}
              />
            </button>

            {isClinicMenuOpen && (
              <div
                className="clinic-dropdown__menu"
                role="listbox"
                aria-label="Lista de clínicas"
              >
                <div className="clinic-dropdown__menu-header">
                  <span>Mis clínicas</span>
                  <span className="clinic-dropdown__count">
                    {clinics.length}
                  </span>
                </div>

                <div className="clinic-dropdown__options">
                  {clinics.map((clinic) => {
                    const isSelected =
                      Number(clinic.id) === Number(clinicId);

                    return (
                      <button
                        key={clinic.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`clinic-dropdown__option ${
                          isSelected
                            ? "clinic-dropdown__option--selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleClinicChange(Number(clinic.id))
                        }
                      >
                        <span className="clinic-dropdown__option-icon">
                          <Building2 size={18} />
                        </span>

                        <span className="clinic-dropdown__option-info">
                          <span className="clinic-dropdown__option-name">
                            {clinic.name}
                          </span>
                          <span className="clinic-dropdown__option-description">
                            Clínica dental
                          </span>
                        </span>

                        {isSelected && (
                          <Check
                            size={19}
                            className="clinic-dropdown__check"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {clinicId && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="treatments-page__add-button"
          >
            <Plus size={18} />
            Nuevo tratamiento
          </button>
        )}
      </div>

      {clinicId && (
        <div className="treatments-page__content">
          <Treatments clinicId={clinicId} />
        </div>
      )}

      {isCreateModalOpen && clinicId && (
        <CreateTreatmentModal
          clinicId={clinicId}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
