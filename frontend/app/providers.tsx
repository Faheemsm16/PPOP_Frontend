"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type AuthContextType = {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AppShell");
  return ctx;
}

type BackendStatus = "unknown" | "connected" | "offline";

export function AppShell({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("unknown");
  const [hydrated, setHydrated] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // ------------------------------------------------------
  // Load auth from localStorage ONCE
  // ------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("ppop_token");
    const storedEmail = localStorage.getItem("ppop_email");

    if (storedToken) setToken(storedToken);
    if (storedEmail) setEmail(storedEmail);

    setHydrated(true);
  }, []);

  const login = (newToken: string, userEmail: string) => {
    setToken(newToken);
    setEmail(userEmail);
    localStorage.setItem("ppop_token", newToken);
    localStorage.setItem("ppop_email", userEmail);
  };

  const logout = () => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem("ppop_token");
    localStorage.removeItem("ppop_email");
    router.replace("/login");
  };

  const isAuthenticated = !!token;

  // ------------------------------------------------------
  // Route protection (NO render loops)
  // ------------------------------------------------------
  useEffect(() => {
    if (!hydrated) return;

    const protectedRoute =
      pathname?.startsWith("/patients") ||
      pathname?.startsWith("/optimize");

    if (!token && protectedRoute && pathname !== "/login") {
      router.replace("/login");
    }
  }, [hydrated, token, pathname]);

  // ------------------------------------------------------
  // Backend health check
  // ------------------------------------------------------
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      setBackendStatus("offline");
      return;
    }

    let cancelled = false;

    async function checkHealth() {
      try {
        const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        if (!cancelled) setBackendStatus("connected");
      } catch {
        if (!cancelled) setBackendStatus("offline");
      }
    }

    checkHealth();
    const id = setInterval(checkHealth, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // 🚨 Do not render anything until auth is loaded
  if (!hydrated) return null;

  const authValue: AuthContextType = {
    token,
    email,
    isAuthenticated,
    login,
    logout,
  };

  const pathnameLabel = (() => {
    if (pathname === "/") return "Home";
    if (pathname?.startsWith("/try")) return "Try Simulation";
    if (pathname?.startsWith("/login")) return "Login";
    if (pathname?.startsWith("/patients/new")) return "New Patient";
    if (pathname?.startsWith("/patients")) return "Patient";
    if (pathname?.startsWith("/optimize")) return "Optimization";
    return "App";
  })();

  return (
    <AuthContext.Provider value={authValue}>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="h-8 w-8 rounded-xl bg-sky-500/20 border border-sky-500/60 flex items-center justify-center text-xs font-bold text-sky-300">
                  P
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    Personalized Prophylaxis Platform
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {pathnameLabel}
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-2 border border-slate-700 bg-slate-900 px-3 py-1 rounded-full">
                <span
                  className={`h-2 w-2 rounded-full ${
                    backendStatus === "connected"
                      ? "bg-emerald-400"
                      : backendStatus === "offline"
                      ? "bg-rose-500"
                      : "bg-amber-400"
                  }`}
                />
                <span>Backend: {backendStatus}</span>
              </div>

              <div className="flex items-center gap-2 border border-slate-700 bg-slate-900 px-3 py-1 rounded-full">
                {isAuthenticated ? (
                  <>
                    <span>{email}</span>
                    <button
                      onClick={logout}
                      className="text-rose-400 hover:underline"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <span>Not signed in</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </div>
    </AuthContext.Provider>
  );
}
