"use client";

import { Search, ShieldCheck, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";

type SearchResult = {
  app: {
    id: string;
    name: string;
    bundleId: string;
    owner: { id: string; email: string; role: string };
  } | null;
};

type Props = {
  initialRegistrationOpen: boolean;
};

export function AdminClient({ initialRegistrationOpen }: Props) {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(initialRegistrationOpen);
  const [bundleQuery, setBundleQuery] = useState("");
  const [result, setResult] = useState<SearchResult["app"] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleRegistration = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/registration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRegistrationOpen: !isRegistrationOpen }),
      });

      const payload = (await response.json()) as { error?: string; isRegistrationOpen?: boolean };

      if (!response.ok || typeof payload.isRegistrationOpen !== "boolean") {
        setError(payload.error ?? "Failed to toggle registration");
        return;
      }

      setIsRegistrationOpen(payload.isRegistrationOpen);
      setMessage(`Registration ${payload.isRegistrationOpen ? "enabled" : "disabled"}`);
    } finally {
      setLoading(false);
    }
  };

  const searchBundle = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);
    setMessage(null);

    if (!bundleQuery.trim()) {
      setError("Bundle ID is required");
      return;
    }

    const response = await fetch(`/api/admin/apps/search?bundleId=${encodeURIComponent(bundleQuery)}`);
    const payload = (await response.json()) as { error?: string; app?: SearchResult["app"] };

    if (!response.ok) {
      setError(payload.error ?? "Lookup failed");
      return;
    }

    setResult(payload.app ?? null);
    if (!payload.app) {
      setMessage("Bundle is not currently registered");
    }
  };

  const deleteApp = async (appId: string) => {
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/apps/${appId}`, {
      method: "DELETE",
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to delete app");
      return;
    }

    setResult(null);
    setMessage("App removed");
  };

  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="grid grid-2">
        <div className="panel compact-panel">
          <h1 style={{ marginBottom: 8 }}>
            <ShieldCheck size={18} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
            Main Admin Console
          </h1>
          <p>Global controls and bundle ownership conflict resolution.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge">Registration: {isRegistrationOpen ? "open" : "closed"}</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={toggleRegistration} disabled={loading}>
            {isRegistrationOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {loading
              ? "Updating..."
              : isRegistrationOpen
                ? "Disable registration"
                : "Enable registration"}
          </button>
        </div>

        <div className="panel compact-panel">
          <h2 style={{ marginBottom: 8 }}>Find Bundle Owner</h2>
          <form className="grid" onSubmit={searchBundle}>
            <label>
              Bundle ID
              <input
                value={bundleQuery}
                onChange={(event) => setBundleQuery(event.target.value)}
                className="mono"
                placeholder="com.company.product"
              />
            </label>
            <button className="btn btn-secondary" type="submit">
              <Search size={16} />
              Search
            </button>
          </form>
        </div>
      </div>

      {result ? (
        <div className="panel compact-panel">
          <div className="card-head" style={{ alignItems: "center" }}>
            <div>
              <h3>{result.name}</h3>
              <p className="mono" style={{ margin: "4px 0" }}>
                {result.bundleId}
              </p>
              <span className="badge">Owner: {result.owner.email}</span>
            </div>
            <button className="btn btn-danger" type="button" onClick={() => deleteApp(result.id)}>
              <Trash2 size={16} />
              Remove App Ownership
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
