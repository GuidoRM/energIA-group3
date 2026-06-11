"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card p-4">
        <Link href="/companies" className="mb-6 block">
          <span className="text-lg font-bold">⚡ Energy Optimizer</span>
        </Link>

        <nav className="flex flex-col gap-1">
          <SidebarLink href="/companies" active={pathname.startsWith("/companies")}>
            Empresas
          </SidebarLink>
        </nav>

        <div className="mt-auto space-y-2 border-t border-border pt-4">
          <div className="px-1 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden bg-background">{children}</main>
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
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
