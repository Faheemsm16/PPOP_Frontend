"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../providers";
import { apiFetch } from "../lib/api";

type Patient = {
  id: string;
  name: string;
  hemophilia_type: "A" | "B";
  severity: string;
  age: number;
  weight_kg: number;
  created_at?: string;
};

export default function PatientsPage() {
  const { token } = useAuth();
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    async function loadPatients() {
      try {
        const res = await apiFetch(`${apiBase}/patients`, token);
        setPatients(res);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, [token]);

  if (loading) return <p>Loading patients...</p>;
  if (error) return <p className="text-rose-400">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Patients</h1>

        <Link
          href="/patients/new"
          className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500"
        >
          + Add new patient
        </Link>
      </div>

      {/* Empty state */}
      {patients.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          No patients found. Add a patient to begin prediction and optimization.
        </div>
      )}

      {/* Table */}
      {patients.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-900">
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Severity</th>
                <th className="text-left py-2 px-3">Age</th>
                <th className="text-left py-2 px-3">Weight (kg)</th>
                <th className="text-left py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-800 hover:bg-slate-900/40"
                >
                  <td className="py-2 px-3 font-medium">{p.name}</td>
                  <td className="py-2 px-3">
                    Hemophilia {p.hemophilia_type}
                  </td>
                  <td className="py-2 px-3">{p.severity}</td>
                  <td className="py-2 px-3">{p.age}</td>
                  <td className="py-2 px-3">{p.weight_kg}</td>
                  <td className="py-2 px-3">
                    <Link
                      href={`/patients/${p.id}`}
                      className="text-sky-400 hover:underline"
                    >
                      Open dashboard →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table> 
        </div>
      )}
    </div>
  );
}