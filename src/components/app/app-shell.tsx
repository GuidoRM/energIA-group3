"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { ChatDrawer } from "@/components/chat/chat-drawer";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Inside a specific company → hide sidebar, show compact top bar
  const isInsideCompany = /^\/companies\/[^/]+/.test(pathname);
  const companyId = pathname.match(/^\/companies\/([^/]+)/)?.[1];

  if (isInsideCompany) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Compact top bar */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-[#e2e8f0] bg-white px-6">
          {/* Back to workspace */}
          <Link
            href="/companies"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Empresas
          </Link>

          <div className="h-4 w-px bg-[#e2e8f0]" />

          {/* Logo — text only */}
          <Link href="/companies" className="text-base font-black tracking-tight">
            <span className="text-[#0f172a]">Energ</span>
            <span className="text-[#22d3ee]">IA</span>
          </Link>

          <div className="flex-1" />

          {/* Agente button */}
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/8 px-3.5 py-1.5 text-sm font-semibold text-[#0ea5e9] hover:bg-[#0ea5e9]/15 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
            Agente
          </button>

          {/* Profile button */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-semibold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/20 text-xs font-bold text-[#0ea5e9]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[120px] truncate text-[#0f172a]">{user.name}</span>
              <svg
                className={cn("h-3.5 w-3.5 text-[#64748b] transition-transform", profileOpen && "rotate-180")}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {profileOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                {/* Dropdown */}
                <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-lg">
                  <div className="border-b border-[#f1f5f9] px-4 py-3">
                    <p className="text-sm font-semibold text-[#0f172a]">{user.name}</p>
                    <p className="text-xs text-[#64748b]">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#64748b] hover:bg-[#fef2f2] hover:text-[#ef4444] transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden bg-[#f8fafc]">{children}</main>

        {companyId && (
          <ChatDrawer
            companyId={companyId}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>
    );
  }

  // Default: sidebar layout
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-[#0f172a] border-r border-[#1e293b]">
        {/* Logo */}
        <Link href="/companies" className="flex items-center gap-3 px-6 py-7 group">
          <div className="h-11 w-1.5 rounded-full bg-gradient-to-b from-[#22d3ee] to-[#0284c7] shrink-0" />
          <div>
            <div className="text-[1.75rem] font-black tracking-tight leading-none">
              <span className="text-white">Energ</span>
              <span className="text-[#22d3ee]">IA</span>
            </div>
            <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#334155]">
              Energy Optimizer
            </div>
          </div>
        </Link>

        <div className="mx-6 mb-5 h-px bg-[#1e293b]" />

        <nav className="flex flex-col gap-1 px-3">
          <SidebarLink href="/companies" active={pathname.startsWith("/companies")}>
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
            </svg>
            Empresas
          </SidebarLink>
        </nav>

        {/* User card — click to logout */}
        <div className="mt-auto px-3 pb-4">
          <div className="mx-0 mb-3 h-px bg-[#1e293b]" />
          <button
            onClick={logout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all hover:bg-[#1e293b]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/15 text-sm font-bold text-[#22d3ee] ring-1 ring-[#0ea5e9]/25">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#cbd5e1]">{user.name}</p>
              <p className="truncate text-[11px] text-[#475569]">{user.email}</p>
            </div>
            <svg className="h-4 w-4 shrink-0 text-[#334155] transition-colors group-hover:text-[#64748b]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden bg-[#f8fafc]">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
        active
          ? "bg-[#FD5212] text-white shadow-sm shadow-[#FD5212]/30"
          : "text-[#475569] hover:bg-[#1e293b] hover:text-[#cbd5e1]",
      )}
    >
      {children}
    </Link>
  );
}
