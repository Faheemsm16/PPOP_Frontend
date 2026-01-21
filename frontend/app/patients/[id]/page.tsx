"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../providers";
import { apiFetch } from "../../lib/api";
import InfusionForm from "./InfusionForm";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Patient = {
  id: string;
  name: string;
  hemophilia_type: "A" | "B";
  severity: string;
  age: number;
  weight_kg: number;
  baseline_factor_percent: number;
  half_life_hours: number;
};

type Infusion = {
  id: string;
  infusion_time: string;
  dose_iu_per_kg: number;
};

type Prediction = {
  factor_percent: number;
  bleed_risk: number;
  risk_category: string;
  meta?: {
    factor_curve?: { hours: number; factor_percent: number }[];
  };
};

export default function PatientDashboard() {
  const params = useParams();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : undefined;
  const { token } = useAuth();
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [infusions, setInfusions] = useState<Infusion[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [regimens, setRegimens] = useState<any[] | null>(null);
  const [optError, setOptError] = useState<string | null>(null);
  const [xai, setXai] = useState<{ feature: string; impact: number }[] | null>(null);
  const [xaiLoading, setXaiLoading] = useState(false);

  // New infusion form
  const [dose, setDose] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !id) return;

    async function load() {
      try {
        const p = await apiFetch(`${apiBase}/patients/${id}`, token);
        const inf = await apiFetch(`${apiBase}/patients/${id}/infusions`, token);

        setPatient(p);
        setInfusions(inf);
        setError(null);
      } catch (e: any) {
        if (e.message === "AUTH_EXPIRED") return;
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, id, apiBase]);

  async function runPrediction() {
    if (!id) {
      setOptError("Invalid patient ID");
      return;
    }
    try {
      const res = await apiFetch(
        `${apiBase}/predict/current-state`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ patient_id: id }),
        }
      );
      setPrediction(res);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadExplanation() {
    if (!id) return;

    setXaiLoading(true);
    try {
      const res = await apiFetch(
        `${apiBase}/predict/explain/${id}`,
        token
      );
      setXai(res.explanation);
    } catch (e: any) {
      console.error(e);
    } finally {
      setXaiLoading(false);
    }
  }

  async function runOptimization() {
    console.log("ID VALUE:", id, typeof id);
    if (!id) {
      setOptError("Invalid patient ID");
      return;
    }
    setOptimizing(true);
    setOptError(null);
    try {
      const res = await apiFetch(
        `${apiBase}/optimize/regimen`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            patient_id: id,
            min_interval_days: 2,
            max_interval_days: 7,
            max_weekly_iu: null,
          }),
        }
      );
      setRegimens(res.regimens);
    } catch (e: any) {
      setOptError(e.message);
    } finally {
      setOptimizing(false);
    }
  }

  async function addInfusion() {
    setSaving(true);
    if (!id) {
      setOptError("Invalid patient ID");
      return;
    }

    try {
      await apiFetch(
        `${apiBase}/patients/${id}/infusions`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            dose_iu_per_kg: Number(dose),
          }),
        }
      );
      setDose("");
      const updated = await apiFetch(
        `${apiBase}/patients/${id}/infusions`,
        token
      );
      setInfusions(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading patient...</p>;
  if (error) return <p className="text-rose-400">{error}</p>;
  if (!patient) return <p>Patient not found.</p>;
  if (!id) return <p>Invalid patient route.</p>;

  return (
    <div className="space-y-8">
      {/* Patient Summary */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-semibold mb-1">Patient Summary</h2>
        <p className="text-sm text-slate-300 mb-3">
          <span className="font-medium">Name:</span> {patient.name}
        </p>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <p>Type: Hemophilia {patient.hemophilia_type}</p>
          <p>Severity: {patient.severity}</p>
          <p>Age: {patient.age} yrs</p>
          <p>Weight: {patient.weight_kg} kg</p>
          <p>Baseline factor: {patient.baseline_factor_percent}%</p>
          <p>Half-life: {patient.half_life_hours} hrs</p>
        </div>
      </section>

      {/* Infusion History */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-semibold mb-3">Infusion History</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-1">Time</th>
              <th className="text-left py-1">Dose (IU/kg)</th>
            </tr>
          </thead>
          <tbody>
            {infusions.map((i) => (
              <tr key={i.id} className="border-b border-slate-800">
                <td className="py-1">
                  {new Date(i.infusion_time).toLocaleString()}
                </td>
                <td className="py-1">{i.dose_iu_per_kg}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <InfusionForm
          patientId={id}
          token={token}
          onSaved={() => {
            apiFetch(`${apiBase}/patients/${id}/infusions`, token).then(setInfusions);
          }}
        />
      </section>

      {/* Prediction */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-semibold mb-3">Current Prediction</h2>

        <button
          onClick={runPrediction}
          className="mb-4 bg-emerald-600 hover:bg-emerald-500 px-4 py-1 rounded text-sm"
        >
          Predict current factor & risk
        </button>

        {prediction && (
          <>
            <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
              <p>
                Factor:{" "}
                <strong>{prediction.factor_percent.toFixed(1)}%</strong>
              </p>
              <p>
                Bleed risk:{" "}
                <strong>{(prediction.bleed_risk * 100).toFixed(1)}%</strong>
              </p>
              <p>
                Category:{" "}
                <strong>{prediction.risk_category}</strong>
              </p>
            </div>

            {prediction.meta?.factor_curve && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prediction.meta.factor_curve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hours" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="factor_percent"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {prediction && (
          <div className="mt-4">
            <button
              onClick={loadExplanation}
              className="text-xs text-sky-400 hover:underline"
            >
              Why is this risk predicted?
            </button>

            {xaiLoading && (
              <p className="text-xs text-slate-400 mt-2">
                Explaining prediction...
              </p>
            )}

            {xai && (
              <ul className="mt-2 text-xs space-y-1">
                {xai.map((x, idx) => (
                  <li key={idx}>
                    <span className="font-medium">
                      {x.feature.replace(/_/g, " ")}
                    </span>
                    :{" "}
                    <span
                      className={
                        x.impact > 0
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }
                    >
                      {x.impact > 0 ? "↑ increases risk" : "↓ reduces risk"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-semibold mb-3">Prophylaxis Optimization</h2>

        <button
          onClick={runOptimization}
          disabled={optimizing}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-60 px-4 py-2 rounded text-sm"
        >
          {optimizing ? "Optimizing..." : "Optimize prophylaxis (NSGA-II)"}
        </button>

        {optError && (
          <p className="mt-2 text-sm text-rose-400">{optError}</p>
        )}

        {regimens && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-1">Dose (IU/kg)</th>
                  <th className="text-left py-1">Interval (days)</th>
                  <th className="text-left py-1">Weekly IU</th>
                  <th className="text-left py-1">Bleed risk</th>
                </tr>
              </thead>
              <tbody>
                {regimens.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800">
                    <td className="py-1">{r.dose_iu_per_kg}</td>
                    <td className="py-1">{r.interval_days}</td>
                    <td className="py-1">{r.weekly_iu.toFixed(0)}</td>
                    <td className="py-1">
                      {(r.predicted_risk * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-2 text-[11px] text-slate-400">
              Solutions represent Pareto-optimal trade-offs between bleed risk
              and treatment burden.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}