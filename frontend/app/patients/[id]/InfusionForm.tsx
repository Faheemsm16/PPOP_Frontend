"use client";

import { useState } from "react";

export default function InfusionForm({
  patientId,
  token,
  onSaved,
}: {
  patientId: string;
  token: string | null;
  onSaved: () => void;
}) {
  const [dose, setDose] = useState("");
  const [datetime, setDatetime] = useState("");
  const [productType, setProductType] = useState<"SHL" | "EHL">("SHL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dose || !datetime) {
      setError("Dose and date/time are required.");
      return;
    }

    const local = new Date(datetime);

    if (Number.isNaN(local.getTime())) {
      setError("Invalid date/time value.");
      return;
    }

    // Convert local time → true UTC ISO string
    const infusionTime = local.toISOString();

    try {
      setLoading(true);

      const apiBase = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${apiBase}/patients/${patientId}/infusions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          dose_iu_per_kg: Number(dose),
          infusion_time: infusionTime,
          product_type: productType,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "API error");
      }

      setDose("");
      setDatetime("");
      setProductType("SHL");

      onSaved();
    } catch (err: any) {
      setError(err.message || "Something failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border border-slate-700 rounded-lg p-4 bg-slate-900/50"
    >
      <h3 className="text-sm font-semibold">Add Infusion</h3>

      {error && <p className="text-rose-400 text-xs">{error}</p>}

      <div className="flex flex-col gap-1 text-sm">
        <label>Dose (IU/kg)</label>
        <input
          type="number"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
          min={0}
          step={1}
          required
        />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <label>Infusion time</label>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
          required
        />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <label>Product type</label>
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value as "SHL" | "EHL")}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
        >
          <option value="SHL">Standard half-life (SHL)</option>
          <option value="EHL">Extended half-life (EHL)</option>
        </select>
      </div>

      <button
        disabled={loading}
        className="bg-sky-600 hover:bg-sky-500 px-3 py-1 rounded text-sm disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save infusion"}
      </button>
    </form>
  );
}
