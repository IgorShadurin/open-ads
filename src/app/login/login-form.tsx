"use client";

import { ArrowRight, LogIn, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
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

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <section className="panel compact-panel" style={{ maxWidth: 520, margin: "32px auto" }}>
      <div className="section-head" style={{ marginBottom: 10 }}>
        <h1>Sign in</h1>
        <span className="badge">Credentials only</span>
      </div>
      <p>Use your OpenAds account email and password.</p>

      <form className="grid" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" name="email" placeholder="you@example.com" required />
        </label>

        <label>
          Password
          <input type="password" name="password" placeholder="********" required />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          <LogIn size={16} />
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/register" className="nav-link">
          <Mail size={14} />
          Register
        </Link>
        <Link href="/" className="nav-link">
          <Shield size={14} />
          Overview
        </Link>
        <Link href="/dashboard" className="nav-link">
          <ArrowRight size={14} />
          Dashboard
        </Link>
      </div>
    </section>
  );
}
