import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getSession()) redirect("/companies");
  return <AuthForm mode="register" />;
}
