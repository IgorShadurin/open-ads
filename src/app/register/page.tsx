import { Lock } from "lucide-react";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/server/auth/guards";
import { getRegistrationState } from "@/server/services/registration";

import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  const isRegistrationOpen = await getRegistrationState();

  if (!isRegistrationOpen) {
    return (
      <section className="panel" style={{ maxWidth: 580, margin: "40px auto" }}>
        <h1 style={{ marginBottom: 8 }}>Registration Closed</h1>
        <p>Main admin has disabled signups at the moment.</p>
        <div className="badge" style={{ marginTop: 12 }}>
          <Lock size={14} style={{ marginRight: 6 }} />
          Wait for admin approval
        </div>
      </section>
    );
  }

  return <RegisterForm />;
}
