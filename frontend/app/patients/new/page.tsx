// app/patients/new/page.tsx
"use client";

import { useState } from "react";

export default function NewPatientPage() {
  const [form, setForm] = useState({
    name: "",
    hospital_id: "",
    hemophilia_type: "A",
    severity: "severe",
    age: "",
    weight_kg: "",
    height_cm: "",
    baseline_factor_percent: "",
    half_life_hours: "",
    activity_level: "1",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("ppop_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            ...form,
            age: Number(form.age),
            weight_kg: Number(form.weight_kg),
            height_cm: Number(form.height_cm),
            baseline_factor_percent: Number(
              form.baseline_factor_percent
            ),
            half_life_hours: Number(form.half_life_hours),
            activity_level: Number(form.activity_level),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to create patient");
      }
      const data = await res.json();
      // redirect to patient's dashboard
      window.location.href = `/patients/${data.id}`;
    } catch (err: any) {
      setError(err.message || "Error creating patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-sm">
      <h1 className="text-2xl font-semibold mb-4">
        New Hemophilia Patient (Clinician)
      </h1>
      <p className="text-xs text-slate-300 mb-4">
        This form is intended for clinicians or authorized users. Outputs are
        stored as part of the research dataset.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Identifiers</h2>
          <div className="space-y-1">
            <label>Patient name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label>Hospital / record ID</label>
            <input
              name="hospital_id"
              value={form.hospital_id}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label>Hemophilia type</label>
            <select
              name="hemophilia_type"
              value={form.hemophilia_type}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            >
              <option value="A">Hemophilia A</option>
              <option value="B">Hemophilia B</option>
            </select>
          </div>
          <div className="space-y-1">
            <label>Severity</label>
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            >
              <option value="severe">Severe</option>
              <option value="moderate">Moderate</option>
              <option value="mild">Mild</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Clinical profile</h2>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label>Age (years)</label>
              <input
                name="age"
                value={form.age}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label>Weight (kg)</label>
              <input
                name="weight_kg"
                value={form.weight_kg}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label>Height (cm)</label>
            <input
              name="height_cm"
              value={form.height_cm}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label>Baseline factor level (%)</label>
            <input
              name="baseline_factor_percent"
              value={form.baseline_factor_percent}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label>Estimated half-life (hours)</label>
            <input
              name="half_life_hours"
              value={form.half_life_hours}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label>Activity level</label>
            <select
              name="activity_level"
              value={form.activity_level}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            >
              <option value="0">Low</option>
              <option value="1">Moderate</option>
              <option value="2">High</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-xs text-rose-400 bg-rose-950/60 border border-rose-800 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 px-4 py-2 rounded-lg text-sm bg-sky-600 hover:bg-sky-500 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create patient"}
      </button>
    </div>
  );
}