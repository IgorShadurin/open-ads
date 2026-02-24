"use client";

import { MailPlus, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <section className="panel compact-panel" style={{ maxWidth: 520, margin: "32px auto" }}>
      <div className="section-head" style={{ marginBottom: 10 }}>
        <h1>Create account</h1>
        <span className="badge">Admin-controlled access</span>
      </div>
      <p>Registration is currently enabled by the main admin.</p>

      <form className="grid" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" name="email" placeholder="you@example.com" required />
        </label>

        <label>
          Password
          <input type="password" name="password" placeholder="At least 8 chars + number" required />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          <UserRoundPlus size={16} />
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="nav-link" style={{ pointerEvents: "none", opacity: 0.85 }}>
          <MailPlus size={14} />
          Email + password
        </span>
      </div>
    </section>
  );
}
