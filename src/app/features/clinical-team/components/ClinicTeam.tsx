import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";

import { useClinic } from "../../clinics/hooks/useClinic";
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
    clinicId,
    setClinicId,
    loading: clinicsLoading,
  } = useClinic();

  const {
    members,
    total,
    loading: teamLoading,
    error,
    reload,
  } = useClinicTeam(clinicId);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState<ClinicTeamMember | null>(null);

  const [deletingMember, setDeletingMember] =
    useState<ClinicTeamMember | null>(null);

  const [deleting, setDeleting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClinic = clinics.find(
    (clinic) => clinic.id === clinicId
  );

  const handleDelete = (member: ClinicTeamMember) => {
    setDeletingMember(member);
  };

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
        clinicId,
        deletingMember.user_id
      );

      toast.success("Integrante eliminado de la clínica.");

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

  if (clinicsLoading) {
    return (
      <div className="clinic-team__state">
        Cargando clínicas...
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="clinic-team__state">
        No tienes clínicas disponibles.
      </div>
    );
  }

  return (
    <section className="clinic-team">
      {/* Encabezado: selector de clínica y botón para agregar */}
      <div className="clinic-team__header">
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

          {isOpen && (
            <div
              className="clinic-team__dropdown"
              role="listbox"
              aria-label="Seleccionar clínica"
            >
              <div className="clinic-team__dropdown-list">
                {clinics.map((clinic) => {
                  const selected =
                    clinic.id === clinicId;

                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`clinic-team__dropdown-option ${
                        selected ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setClinicId(clinic.id);
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
                        {clinic.name}
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

        <div className="clinic-team__actions">
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