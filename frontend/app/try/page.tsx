// app/try/page.tsx
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type FactorPoint = {
  hours: number;
  factor_percent: number;
};

type SimResult = {
  factor_percent: number;
  bleed_risk: number;
  risk_category: string;
  meta?: {
    note?: string;
    factor_curve?: FactorPoint[];
  };
};

type FormState = {
  hemophilia_type: "A" | "B";
  severity: "severe" | "moderate" | "mild";
  age: string;
  weight_kg: string;
  baseline_factor_percent: string;
  half_life_hours: string;
  product_type: "SHL" | "EHL";
  dose_iu_per_kg: string;
  interval_days: string;
  activity_level: string;
};

export default function TryPage() {
  const [form, setForm] = useState<FormState>({
    hemophilia_type: "A",
    severity: "severe",
    age: "",
    weight_kg: "",
    baseline_factor_percent: "",
    half_life_hours: "",
    product_type: "SHL",
    dose_iu_per_kg: "",
    interval_days: "2",
    activity_level: "1",
  });

  const [touched, setTouched] = useState({
    baseline_factor_percent: false,
    half_life_hours: false,
    dose_iu_per_kg: false,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- default logic helpers ---

  function defaultBaseline(severity: string): number {
    switch (severity) {
      case "severe":
        return 0.5; // <1%
      case "moderate":
        return 3; // 1–5%
      case "mild":
        return 15; // 5–40%
      default:
        return 1;
    }
  }

  function defaultHalfLife(hemophilia_type: string, age: number): number {
    // very crude but reasonable for a demo
    const isChild = age > 0 && age < 12;
    if (hemophilia_type === "A") {
      // typical FVIII
      return isChild ? 8 : 10; // hours
    } else {
      // hemophilia B, FIX
      return isChild ? 18 : 22;
    }
  }

  function defaultDose(severity: string): number {
    switch (severity) {
      case "severe":
        return 30; // IU/kg
      case "moderate":
        return 25;
      case "mild":
        return 20;
      default:
        return 25;
    }
  }

  function applyDefaults(next: FormState, prevTouched = touched): FormState {
    const ageNum = Number(next.age);
    // baseline
    if (!prevTouched.baseline_factor_percent) {
      next.baseline_factor_percent = defaultBaseline(next.severity).toString();
    }
    // half-life
    if (!prevTouched.half_life_hours) {
      const hl = defaultHalfLife(next.hemophilia_type, isNaN(ageNum) ? 18 : ageNum);
      next.half_life_hours = hl.toString();
    }
    // dose
    if (!prevTouched.dose_iu_per_kg) {
      next.dose_iu_per_kg = defaultDose(next.severity).toString();
    }
    return next;
  }

  // --- form handlers ---

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next: FormState = { ...prev, [name]: value } as FormState;

      // Whenever key fields change, update defaults if user hasn't overridden
      if (
        name === "severity" ||
        name === "hemophilia_type" ||
        name === "age"
      ) {
        return applyDefaults(next);
      }

      return next;
    });

    if (
      name === "baseline_factor_percent" ||
      name === "half_life_hours" ||
      name === "dose_iu_per_kg"
    ) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleSimulate = async () => {
    setError(null);
    setResult(null);

    // basic sanity: require age, weight, and interval
    if (!form.age || !form.weight_kg) {
      setError("Please fill age and weight first so the system can estimate defaults.");
      return;
    }

    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBase) {
        throw new Error(
          "NEXT_PUBLIC_API_URL is not set in .env.local (frontend)."
        );
      }

      const payload = {
        hemophilia_type: form.hemophilia_type,
        severity: form.severity,
        age: Number(form.age),
        weight_kg: Number(form.weight_kg),
        baseline_factor_percent: Number(form.baseline_factor_percent || 0),
        half_life_hours: Number(form.half_life_hours || 0),
        product_type: form.product_type,
        dose_iu_per_kg: Number(form.dose_iu_per_kg || 0),
        interval_days: Number(form.interval_days || 1),
        activity_level: Number(form.activity_level),
      };

      const res = await fetch(`${apiBase}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Simulation failed (${res.status}): ${text}`);
      }

      const data = (await res.json()) as SimResult;
      setResult(data);
    } catch (err: any) {
      console.error("Simulate error:", err);
      setError(err.message || "Simulation error (failed to fetch)");
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">
        Try Without Patient ID / Name
      </h1>
      <p className="text-xs text-slate-300 mb-6">
        Fill in basic details (type, severity, age, weight). The system will
        automatically estimate baseline factor level, half-life, and a typical
        prophylaxis dose for you. You can adjust any value if you already know it.
      </p>

      <div className="grid gap-6 md:grid-cols-2 text-sm">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Clinical details
          </h2>
          <div className="space-y-1">
            <label>Hemophilia type</label>
            <select
              name="hemophilia_type"
              value={form.hemophilia_type}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            >
              <option value="A">Hemophilia A (FVIII)</option>
              <option value="B">Hemophilia B (FIX)</option>
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
              <option value="severe">Severe (&lt;1%)</option>
              <option value="moderate">Moderate (1–5%)</option>
              <option value="mild">Mild (&gt;5%)</option>
            </select>
          </div>
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
            <label>
              Baseline factor level (%){" "}
              <span className="text-[10px] text-slate-400">
                (auto-estimated from severity, editable)
              </span>
            </label>
            <input
              name="baseline_factor_percent"
              value={form.baseline_factor_percent}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label>
              Estimated half-life (hours){" "}
              <span className="text-[10px] text-slate-400">
                (auto-estimated from type + age, editable)
              </span>
            </label>
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
              <option value="0">Low (mostly sedentary)</option>
              <option value="1">Moderate (school/work, some play)</option>
              <option value="2">High (sports / intense activity)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Prophylaxis regimen
          </h2>
          <div className="space-y-1">
            <label>Product type</label>
            <select
              name="product_type"
              value={form.product_type}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            >
              <option value="SHL">Standard half-life (SHL)</option>
              <option value="EHL">Extended half-life (EHL)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label>
              Dose per infusion (IU/kg){" "}
              <span className="text-[10px] text-slate-400">
                (auto-estimated from severity, editable)
              </span>
            </label>
            <input
              name="dose_iu_per_kg"
              value={form.dose_iu_per_kg}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label>Interval (days between doses)</label>
            <input
              name="interval_days"
              value={form.interval_days}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="mt-2 px-4 py-2 rounded-lg text-sm bg-sky-600 hover:bg-sky-500 disabled:opacity-60"
          >
            {loading ? "Simulating..." : "Simulate factor level & risk"}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
            <h2 className="text-sm font-semibold mb-3 text-slate-100">
              Simulation result (summary)
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Estimated average factor</p>
                <p className="text-xl font-semibold">
                  {result.factor_percent.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  Predicted bleed risk (time window)
                </p>
                <p className="text-xl font-semibold">
                  {(result.bleed_risk * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Risk category</p>
                <p className="text-xl font-semibold capitalize">
                  {result.risk_category}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-amber-400">
              Model-based estimate using a simplified PK curve. Not a substitute for
              measured levels or clinical judgement.
            </p>
          </div>

          {result.meta?.factor_curve && result.meta.factor_curve.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
              <h2 className="text-sm font-semibold mb-3 text-slate-100">
                Factor level over time after infusion
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.meta.factor_curve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hours"
                      tickFormatter={(h) => `${h}h`}
                      label={{
                        value: "Hours since infusion",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      label={{
                        value: "Factor level (%)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "factor_percent"
                          ? [`${(value as number).toFixed(1)}%`, "Factor level"]
                          : [value, name]
                      }
                      labelFormatter={(h) => `${h} hours`}
                    />
                    <Line
                      type="monotone"
                      dataKey="factor_percent"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Curve shows factor levels over time after a single dose using the
                entered half-life and baseline level.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}