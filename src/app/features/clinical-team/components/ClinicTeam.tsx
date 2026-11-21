
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";

import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";
import { useClinicTeam } from "../hooks/useClinicTeam";
import { deleteClinicTeamMember } from "../services/clinicTeamServices";

import ClinicTeamTable from "./ClinicTeamTable";
import ClinicTeamModal from "./ClinicTeamEditModal";
import ClinicTeamCreateModal from "./ClinicTeamCreateModal";
import DeleteClinicTeamMemberModal from "./DeleteClinicTeamMemberModal";

import type { ClinicTeamMember } from "../types/clinicTeam";

import "../css/Clinicteam.css";

export default function ClinicTeam() {
  const {
    clinics,
    clinic,
    clinicId,
    setClinicId,
    members,
    total,
    clinicsLoading,
    loading: teamLoading,
    error,
    reload,
  } = useClinicTeam();

  const [isOpen, setIsOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState<ClinicTeamMember | null>(null);

  const [deletingMember, setDeletingMember] =
    useState<ClinicTeamMember | null>(null);

  const [deleting, setDeleting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClinic = clinic;

  // Seleccionar integrante para eliminar.
  const handleDelete = (member: ClinicTeamMember) => {
    setDeletingMember(member);
  };

  // Confirmar eliminación de integrante.
  const handleConfirmDelete = async () => {
    if (
      !deletingMember ||
      clinicId === null ||
      deleting
    ) {
      return;
    }

    setDeleting(true);

    try {
      await deleteClinicTeamMember(
        deletingMember.user_id
      );

      toast.success(
        "Integrante eliminado correctamente."
      );

      setDeletingMember(null);

      await reload();
    } catch (error) {
      console.error(
        "Error al eliminar al integrante:",
        error
      );

      toast.error(
        "No se pudo eliminar al integrante."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Cerrar selector al hacer clic fuera.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // Estado de carga.
  if (clinicsLoading) {
    return <LoadingScreen />;
  }

  // No hay clínicas disponibles.
  if (clinics.length === 0) {
    return (
      <div className="clinic-team__state">
        No tienes clínicas disponibles.
      </div>
    );
  }

  return (
    <section className="clinic-team">

      {/* Barra superior independiente */}
      <div className="clinic-team__toolbar">

        {/* Selector de clínicas */}
        <div
          className="clinic-team__selector"
          ref={dropdownRef}
        >
          <label className="clinic-team__selector-label">
            Selecciona una clínica
          </label>

          <button
            type="button"
            className={`clinic-team__selector-trigger ${
              isOpen ? "is-open" : ""
            }`}
            onClick={() =>
              setIsOpen((previous) => !previous)
            }
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="clinic-team__selector-icon">
              <Building2 size={20} />
            </span>

            <span className="clinic-team__selector-content">
              <span className="clinic-team__selector-name">
                {selectedClinic?.name ??
                  "Selecciona una clínica"}
              </span>

              <span className="clinic-team__selector-caption">
                Clínica dental
              </span>
            </span>

            <ChevronDown
              size={19}
              className={`clinic-team__selector-chevron ${
                isOpen ? "is-open" : ""
              }`}
            />
          </button>

          {/* Opciones del selector */}
          {isOpen && (
            <div
              className="clinic-team__dropdown"
              role="listbox"
              aria-label="Seleccionar clínica"
            >
              <div className="clinic-team__dropdown-list">

                {clinics.map((item) => {
                  const selected = item.id === clinicId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`clinic-team__dropdown-option ${
                        selected ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setClinicId(item.id);

                        setIsOpen(false);
                        setEditingMember(null);
                        setDeletingMember(null);
                        setIsCreateModalOpen(false);
                      }}
                    >
                      <span className="clinic-team__dropdown-icon">
                        <Building2 size={18} />
                      </span>

                      <span className="clinic-team__dropdown-name">
                        {item.name}
                      </span>

                      {selected && (
                        <Check
                          size={18}
                          className="clinic-team__dropdown-check"
                        />
                      )}
                    </button>
                  );
                })}

              </div>
            </div>
          )}
        </div>

        {/* Acción independiente: agregar integrante */}
        <div className="clinic-team__add-action">
          <button
            type="button"
            className="clinic-team__add-button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={clinicId === null}
          >
            <UserPlus size={18} />
            <span>Agregar integrante</span>
          </button>
        </div>

      </div>

      {/* Tabla del equipo clínico */}
      <ClinicTeamTable
        members={members}
        total={total}
        loading={teamLoading}
        error={error}
        clinicId={clinicId}
        onReload={() => void reload()}
        onEdit={setEditingMember}
        onDelete={handleDelete}
      />

      {/* Modal para editar un integrante */}
      {editingMember && clinicId !== null && (
        <ClinicTeamModal
          clinicId={clinicId}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={() => {
            setEditingMember(null);
            void reload();
          }}
        />
      )}

      {/* Modal para eliminar un integrante */}
      {deletingMember && (
        <DeleteClinicTeamMemberModal
          memberName={deletingMember.name}
          loading={deleting}
          onClose={() => {
            if (!deleting) {
              setDeletingMember(null);
            }
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modal para crear un integrante */}
      {isCreateModalOpen && clinicId !== null && (
        <ClinicTeamCreateModal
          clinicId={clinicId}
          onClose={() =>
            setIsCreateModalOpen(false)
          }
          onCreated={() => {
            setIsCreateModalOpen(false);
            void reload();
          }}
        />
      )}

    </section>
  );
}
