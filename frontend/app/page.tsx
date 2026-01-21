"use client";

import Link from "next/link";
import { useAuth } from "./providers";

export default function HomePage() {
  const { token, logout } = useAuth();
  const isLoggedIn = Boolean(token);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2 items-center">
        {/* LEFT */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Personalized Prophylaxis Optimization Platform
          </h1>

          <p className="text-sm text-slate-300">
            Prototype decision-support tool for hemophilia A &amp; B. Estimate
            patient-specific factor levels, bleed risk, and generate optimized
            prophylaxis regimens using ML and NSGA-II.
          </p>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/try"
              className="px-4 py-2 rounded-lg text-sm bg-sky-600 hover:bg-sky-500"
            >
              Try without patient ID
            </Link>

            {!isLoggedIn && (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm border border-slate-600 hover:border-sky-500"
              >
                Clinician login
              </Link>
            )}

            {isLoggedIn && (
              <>
                <Link
                  href="/patients"
                  className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500"
                >
                  View patients
                </Link>

                <Link
                  href="/patients/new"
                  className="px-4 py-2 rounded-lg text-sm border border-slate-600 hover:border-emerald-500"
                >
                  Add new patient
                </Link>

                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg text-sm border border-rose-600 text-rose-400 hover:bg-rose-950"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* STATUS */}
          {isLoggedIn && (
            <p className="text-xs text-emerald-400 mt-2">
              ✓ Clinician authenticated
            </p>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs">
          <h2 className="text-sm font-semibold text-slate-100">
            What this prototype does
          </h2>

          <ul className="space-y-2 list-disc list-inside text-slate-300">
            <li>
              Accepts patient-specific clinical inputs for hemophilia A &amp; B.
            </li>
            <li>
              Estimates current factor levels and bleed risk using temporal ML.
            </li>
            <li>
              Uses NSGA-II to generate patient-specific prophylaxis regimens.
            </li>
            <li>
              Enables clinician-in-the-loop comparison of trade-offs.
            </li>
          </ul>

          <p className="text-[11px] text-amber-400">
            Research prototype only. Outputs are not validated for clinical use.
          </p>
        </div>
      </div>
    </div>
  );
}