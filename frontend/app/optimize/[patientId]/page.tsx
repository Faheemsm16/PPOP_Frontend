// app/optimize/[patientId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Regimen = {
  id?: string;
  dose_iu_per_kg: number;
  interval_days: number;
  product_type: string;
  weekly_iu: number;
  predicted_annual_bleeds: number;
  predicted_risk: number;
};

export default function OptimizePage() {
  const params = useParams();
  const patientId = params?.patientId as string;

  const [regimens, setRegimens] = useState<Regimen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [constraints, setConstraints] = useState({
    max_weekly_iu: "",
    min_interval_days: "2",
    max_interval_days: "4",
  });

  useEffect(() => {
    if (!patientId) return;
    // auto-run optimization on first load
    handleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleConstraintsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConstraints((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOptimize = async () => {
    setError(null);
    setLoading(true);
    setRegimens([]);
    try {
      const token = localStorage.getItem("ppop_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/optimize/regimen`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            patient_id: patientId,
            max_weekly_iu: constraints.max_weekly_iu
              ? Number(constraints.max_weekly_iu)
              : undefined,
            min_interval_days: Number(constraints.min_interval_days),
            max_interval_days: Number(constraints.max_interval_days),
          }),
        }
      );
      if (!res.ok) throw new Error("Optimization failed");
      const data = await res.json();
      setRegimens(data.regimens || []);
    } catch (err: any) {
      setError(err.message || "Error running optimization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-sm space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            Prophylaxis Optimization
          </h1>
          <p className="text-xs text-slate-400">
            Patient ID: {patientId}. NSGA-II based multi-objective regimen
            search.
          </p>
        </div>
        <button
          onClick={() => (window.location.href = `/patients/${patientId}`)}
          className="px-4 py-2 rounded-lg border border-slate-700 hover:border-sky-500"
        >
          Back to patient
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Optimization constraints
        </h2>
        <div className="grid md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label>Max weekly IU (optional)</label>
            <input
              name="max_weekly_iu"
              value={constraints.max_weekly_iu}
              onChange={handleConstraintsChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label>Min interval (days)</label>
            <input
              name="min_interval_days"
              value={constraints.min_interval_days}
              onChange={handleConstraintsChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label>Max interval (days)</label>
            <input
              name="max_interval_days"
              value={constraints.max_interval_days}
              onChange={handleConstraintsChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>
        </div>
        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800 rounded px-3 py-2">
            {error}
          </p>
        )}
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm bg-sky-600 hover:bg-sky-500 disabled:opacity-60"
        >
          {loading ? "Running NSGA-II..." : "Re-run optimization"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Pareto candidates
        </h2>
        {regimens.length === 0 && !loading ? (
          <p className="text-xs text-slate-400">
            No regimens available yet. Run optimization above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80">
                <tr className="text-slate-300">
                  <th className="text-left py-2 px-2">Dose (IU/kg)</th>
                  <th className="text-left py-2 px-2">Interval (days)</th>
                  <th className="text-left py-2 px-2">Product</th>
                  <th className="text-left py-2 px-2">Weekly IU</th>
                  <th className="text-left py-2 px-2">
                    Pred. annual bleeds
                  </th>
                  <th className="text-left py-2 px-2">Risk score</th>
                </tr>
              </thead>
              <tbody>
                {regimens.map((r, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-slate-800 hover:bg-slate-900/60"
                  >
                    <td className="py-2 px-2">{r.dose_iu_per_kg}</td>
                    <td className="py-2 px-2">{r.interval_days}</td>
                    <td className="py-2 px-2">{r.product_type}</td>
                    <td className="py-2 px-2">{r.weekly_iu.toFixed(1)}</td>
                    <td className="py-2 px-2">
                      {r.predicted_annual_bleeds.toFixed(2)}
                    </td>
                    <td className="py-2 px-2">
                      {r.predicted_risk.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-amber-400">
          Each row is a Pareto-optimal regimen balancing predicted bleed burden
          vs factor usage. Clinicians must interpret trade-offs in context of
          individual patient goals and constraints.
        </p>
      </div>
    </div>
  );
}