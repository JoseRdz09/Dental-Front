// features/clinics/hooks/useClinic.ts
import { useEffect, useState } from "react";
import { getMyClinics } from "../services/clinicService"; // ajusta al nombre real de tu archivo
import type { Clinic } from "../types/clinic";

export function useClinic() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMyClinics()
      .then((data) => {
        if (!active) return;
        setClinics(data);
        setClinicId(data[0]?.id ?? null); // por defecto, la primera
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las clínicas.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { clinics, clinicId, setClinicId, loading, error };
}