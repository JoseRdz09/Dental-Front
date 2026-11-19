
import Treatments from "../components/Treatment";
import { useClinicTeam } from "../../clinical-team/hooks/useClinicTeam";
import "../css/TreatmentsPage.css";

export default function TreatmentsPage() {
  const {
    clinics,
    clinicId,
    setClinicId,
    clinicsLoading,
  } = useClinicTeam();

  if (clinicsLoading) {
    return (
      <div className="treatments-page__state">
        <p>Loading clinics...</p>
      </div>
    );
  }

  if (!clinics.length) {
    return (
      <div className="treatments-page__state treatments-page__state--empty">
        <p>No clinics available.</p>
      </div>
    );
  }

  return (
    <div className="treatments-page">

      {/* Clinic selector */}
      <div className="treatments-page__selector">
        <label
          htmlFor="clinic-select"
          className="treatments-page__label"
        >
          Select clinic
        </label>

        <select
          id="clinic-select"
          value={clinicId ?? ""}
          onChange={(e) => setClinicId(Number(e.target.value))}
          className="treatments-page__select"
        >
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </div>

      {/* Treatments */}
      {clinicId && (
        <div className="treatments-page__content">
          <Treatments clinicId={clinicId} />
        </div>
      )}

    </div>
  );
}
