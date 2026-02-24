import { redirect } from "next/navigation";

import { getSessionUser } from "@/server/auth/guards";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
