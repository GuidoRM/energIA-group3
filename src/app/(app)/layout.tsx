import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { getSession } from "@/lib/auth";

/** Layout de rutas protegidas: resuelve la sesión o redirige a /login (RF1.4). */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}
