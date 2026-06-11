"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };
    if (!isLogin) {
      body.name = String(form.get("name"));
      const org = String(form.get("organizationName") ?? "");
      if (org) body.organizationName = org;
    }

    try {
      await apiFetch(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push("/companies");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FD5212] text-white mb-4 shadow-sm">
          <svg className="w-6 h-6 select-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 21v-9H5L13 3v9h6L11 21z" />
          </svg>
        </div>
        <h1 className="text-[32px] font-bold text-[#281813] mb-1 tracking-tight">
          {isLogin ? "Iniciar sesión" : "Crear cuenta"}
        </h1>
        <p className="text-[14px] text-[#5c4038] font-medium">
          Austral Energy Optimizer
        </p>
      </div>

      {/* Card for Form */}
      <div className="bg-white rounded-[16px] border border-[#e5beb3] p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Name Input (Register only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="name">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
                  <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Juan Pérez"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tu@empresa.com"
                required
                className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="password">
                Contraseña
              </label>
              {isLogin && (
                <Link
                  href="#"
                  className="text-[11px] font-semibold text-[#FD5212] hover:text-[#C15735] transition-colors"
                >
                  ¿Olvidé mi contraseña?
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                minLength={isLogin ? undefined : 8}
                className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Organization Name Input (Register only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="organizationName">
                Organización (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
                  <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  placeholder="Mi PyME"
                  className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium flex items-center gap-2">
              <svg className="w-5 h-5 select-none text-destructive" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-full text-sm font-bold text-white bg-[#FD5212] hover:bg-[#e0450b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FD5212] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                "Iniciar Sesión"
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </div>
        </form>

        {/* Registration / Login Toggler */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#281813] font-medium">
            {isLogin ? "¿No tengo una cuenta? " : "¿Ya tenés cuenta? "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="font-semibold text-[#FD5212] hover:text-[#C15735] transition-colors"
            >
              {isLogin ? "Registrarme" : "Iniciá sesión"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
