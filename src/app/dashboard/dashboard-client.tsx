"use client";

import {
  BarChart,
  ChevronDown,
  ChevronUp,
  CircleX,
  Gift,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Tv,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { filterAppsByQuery } from "./dashboard-ui";

type AppRecord = {
  id: string;
  name: string;
  bundleId: string;
  isActive: boolean;
  fallbackMediaType: "VIDEO" | "IMAGE" | null;
  fallbackMediaUrl: string | null;
  fallbackClickUrl: string | null;
  fallbackRewardSeconds: number;
  owner: { id: string; email: string };
  stats: {
    initCount: number;
    shownCount: number;
    canceledCount: number;
    rewardedCount: number;
    clickedCount: number;
  } | null;
  ads: Array<{
    id: string;
    appId: string | null;
    scope: "APP_ONLY" | "ALL_APPS";
    title: string;
    mediaType: "VIDEO" | "IMAGE";
    mediaUrl: string;
    clickUrl: string | null;
    rewardSeconds: number;
    priority: number;
    isActive: boolean;
  }>;
};

type Props = {
  sessionUser: { id: string; email: string; role: "SUPER_ADMIN" | "USER" };
  initialApps: AppRecord[];
};

const getCtr = (shown: number, clicked: number): string => {
  if (shown < 1) {
    return "0%";
  }

  return `${Math.round((clicked / shown) * 100)}%`;
};

const isSafeExternalUrl = (value: string): boolean => /^https?:\/\//i.test(value);

export function DashboardClient({ initialApps, sessionUser }: Props) {
  const router = useRouter();
  const [apps, setApps] = useState(initialApps);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(initialApps[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return apps.reduce(
      (acc, app) => {
        const stats = app.stats;

        acc.apps += 1;
        acc.ads += app.ads.length;
        acc.initializations += stats?.initCount ?? 0;
        acc.shown += stats?.shownCount ?? 0;
        acc.clicked += stats?.clickedCount ?? 0;
        return acc;
      },
      { apps: 0, ads: 0, initializations: 0, shown: 0, clicked: 0 },
    );
  }, [apps]);

  const filteredApps = useMemo(() => filterAppsByQuery(apps, searchQuery), [apps, searchQuery]);

  const reloadApps = async () => {
    const response = await fetch("/api/apps", { cache: "no-store" });
    const payload = (await response.json()) as { apps?: AppRecord[]; error?: string };

    if (!response.ok || !payload.apps) {
      throw new Error(payload.error ?? "Failed to load apps");
    }

    setApps(payload.apps);
    if (payload.apps.length > 0 && !payload.apps.some((app) => app.id === expandedAppId)) {
      setExpandedAppId(payload.apps[0]?.id ?? null);
    }
  };

  const runMutation = async (call: () => Promise<Response>, okMessage: string): Promise<boolean> => {
    setError(null);
    setMessage(null);

    try {
      const response = await call();
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Request failed");
      }

      setMessage(okMessage);
      await reloadApps();
      router.refresh();
      return true;
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unknown error");
      return false;
    }
  };

  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="grid grid-2">
        <div className="panel compact-panel">
          <div className="section-head">
            <h1>Dashboard</h1>
            {sessionUser.role === "SUPER_ADMIN" ? (
              <div className="badge">
                <ShieldCheck size={14} style={{ marginRight: 6 }} />
                Super admin
              </div>
            ) : null}
          </div>
          <p>
            Signed in as <span className="mono">{sessionUser.email}</span>. Only registered bundle IDs are eligible
            for ad delivery.
          </p>

          <div className="metrics-row">
            <div className="metric-pill">
              <strong>{totals.apps}</strong>
              <span>Apps</span>
            </div>
            <div className="metric-pill">
              <strong>{totals.ads}</strong>
              <span>Creatives</span>
            </div>
            <div className="metric-pill">
              <strong>{totals.initializations}</strong>
              <span>Inits</span>
            </div>
            <div className="metric-pill">
              <strong>{getCtr(totals.shown, totals.clicked)}</strong>
              <span>CTR</span>
            </div>
          </div>
        </div>

        <div className="panel compact-panel">
          <h2 style={{ marginBottom: 10 }}>Quick Add App</h2>
          <form
            className="grid"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);

              const ok = await runMutation(
                () =>
                  fetch("/api/apps", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: String(form.get("name") ?? ""),
                      bundleId: String(form.get("bundleId") ?? ""),
                    }),
                  }),
                "App created",
              );

              if (ok) {
                event.currentTarget.reset();
              }
            }}
          >
            <div className="form-row">
              <label>
                App Name
                <input name="name" placeholder="My iOS App" required />
              </label>
              <label>
                Bundle ID
                <input name="bundleId" className="mono" placeholder="com.company.product" required />
              </label>
            </div>
            <button className="btn btn-primary" type="submit">
              <Plus size={16} />
              Add App
            </button>
          </form>
        </div>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="panel compact-panel toolbar">
        <div>
          <h2>Applications</h2>
          <p>
            Showing {filteredApps.length} of {apps.length}
          </p>
        </div>
        <div className="toolbar-actions">
          <label className="field-inline" aria-label="Search apps">
            <Search size={14} />
            <input
              placeholder="Search by app, bundle, or owner"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          {searchQuery ? (
            <button type="button" className="btn btn-secondary" onClick={() => setSearchQuery("")}>
              <X size={16} />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid" style={{ gap: 12 }}>
        {apps.length === 0 ? (
          <div className="panel compact-panel empty-state">
            <h3>No apps yet</h3>
            <p>Create your first iOS app above to start ad delivery.</p>
          </div>
        ) : null}

        {apps.length > 0 && filteredApps.length === 0 ? (
          <div className="panel compact-panel empty-state">
            <h3>No matches found</h3>
            <p>Try a different bundle ID, app name, or owner email.</p>
          </div>
        ) : null}

        {filteredApps.map((app) => {
          const isExpanded = expandedAppId === app.id;
          const shown = app.stats?.shownCount ?? 0;
          const clicked = app.stats?.clickedCount ?? 0;

          return (
            <article key={app.id} className="panel compact-panel" style={{ display: "grid", gap: 12 }}>
              <div className="card-head">
                <div>
                  <h2>{app.name}</h2>
                  <p className="mono" style={{ margin: "4px 0" }}>
                    {app.bundleId}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge">{app.isActive ? "active" : "inactive"}</span>
                    <span className="badge">owner {app.owner.email}</span>
                    <span className="badge">ads {app.ads.length}</span>
                    <span className="badge">CTR {getCtr(shown, clicked)}</span>
                  </div>
                </div>

                <div className="action-row">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {isExpanded ? "Collapse" : "Manage"}
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() =>
                      runMutation(
                        () =>
                          fetch(`/api/apps/${app.id}`, {
                            method: "DELETE",
                          }),
                        "App deleted",
                      )
                    }
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>

              <div className="metrics-row compact">
                <div className="metric-pill">
                  <strong>{app.stats?.initCount ?? 0}</strong>
                  <span>Inits</span>
                </div>
                <div className="metric-pill">
                  <strong>{app.stats?.shownCount ?? 0}</strong>
                  <span>Shown</span>
                </div>
                <div className="metric-pill">
                  <strong>{app.stats?.clickedCount ?? 0}</strong>
                  <span>Clicks</span>
                </div>
                <div className="metric-pill">
                  <strong>{app.stats?.rewardedCount ?? 0}</strong>
                  <span>Rewarded</span>
                </div>
                <div className="metric-pill">
                  <strong>{app.stats?.canceledCount ?? 0}</strong>
                  <span>Canceled</span>
                </div>
              </div>

              {isExpanded ? (
                <>
                  <div className="grid grid-2" style={{ gap: 12 }}>
                    <section className="panel" style={{ background: "#f7fcff", boxShadow: "none", padding: 14 }}>
                      <h3 style={{ marginBottom: 10 }}>
                        <Sparkles size={16} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                        Fallback Ad
                      </h3>
                      <form
                        className="grid"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);

                          const rawType = String(form.get("fallbackMediaType") ?? "");
                          const payload = {
                            fallbackMediaType: rawType ? rawType : null,
                            fallbackMediaUrl: (String(form.get("fallbackMediaUrl") ?? "") || null) as string | null,
                            fallbackClickUrl: (String(form.get("fallbackClickUrl") ?? "") || null) as string | null,
                            fallbackRewardSeconds: Number(form.get("fallbackRewardSeconds") ?? 15),
                            isActive: form.get("isActive") === "on",
                          };

                          await runMutation(
                            () =>
                              fetch(`/api/apps/${app.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload),
                              }),
                            "Fallback updated",
                          );
                        }}
                      >
                        <div className="form-row">
                          <label>
                            Media Type
                            <select name="fallbackMediaType" defaultValue={app.fallbackMediaType ?? ""}>
                              <option value="">None</option>
                              <option value="VIDEO">Video</option>
                              <option value="IMAGE">Image</option>
                            </select>
                          </label>
                          <label>
                            Seconds
                            <input
                              name="fallbackRewardSeconds"
                              type="number"
                              min={5}
                              max={120}
                              defaultValue={app.fallbackRewardSeconds}
                              required
                            />
                          </label>
                        </div>

                        <label>
                          Fallback Media URL
                          <input
                            name="fallbackMediaUrl"
                            defaultValue={app.fallbackMediaUrl ?? ""}
                            placeholder="https://cdn.example.com/fallback.mp4"
                          />
                        </label>

                        <label>
                          Fallback Click URL
                          <input
                            name="fallbackClickUrl"
                            defaultValue={app.fallbackClickUrl ?? ""}
                            placeholder="https://example.com"
                          />
                        </label>

                        <label style={{ gridAutoFlow: "column", justifyContent: "start", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" name="isActive" defaultChecked={app.isActive} style={{ width: 18 }} />
                          App active
                        </label>

                        <button className="btn btn-secondary" type="submit">
                          <Save size={16} />
                          Save Fallback
                        </button>
                      </form>
                    </section>

                    <section className="panel" style={{ background: "#f7fcff", boxShadow: "none", padding: 14 }}>
                      <h3 style={{ marginBottom: 10 }}>
                        <Plus size={16} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                        Add Creative
                      </h3>
                      <form
                        className="grid"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          const payload = {
                            title: String(form.get("title") ?? ""),
                            mediaType: String(form.get("mediaType") ?? "VIDEO"),
                            mediaUrl: String(form.get("mediaUrl") ?? ""),
                            clickUrl: String(form.get("clickUrl") ?? "") || null,
                            scope: String(form.get("scope") ?? "APP_ONLY"),
                            rewardSeconds: Number(form.get("rewardSeconds") ?? 15),
                            priority: Number(form.get("priority") ?? 0),
                          };

                          const ok = await runMutation(
                            () =>
                              fetch(`/api/apps/${app.id}/ads`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload),
                              }),
                            "Ad created",
                          );

                          if (ok) {
                            event.currentTarget.reset();
                          }
                        }}
                      >
                        <div className="form-row">
                          <label>
                            Title
                            <input name="title" placeholder="Launch campaign" required />
                          </label>
                          <label>
                            Type
                            <select name="mediaType" defaultValue="VIDEO">
                              <option value="VIDEO">Video</option>
                              <option value="IMAGE">Image</option>
                            </select>
                          </label>
                        </div>

                        <div className="form-row">
                          <label>
                            Target
                            <select name="scope" defaultValue="APP_ONLY">
                              <option value="APP_ONLY">This app</option>
                              <option value="ALL_APPS">All apps</option>
                            </select>
                          </label>
                          <label>
                            Reward seconds
                            <input type="number" name="rewardSeconds" min={5} max={120} defaultValue={15} required />
                          </label>
                        </div>

                        <label>
                          Media URL
                          <input name="mediaUrl" placeholder="https://cdn.example.com/ad.mp4" required />
                        </label>

                        <label>
                          Click URL
                          <input name="clickUrl" placeholder="https://example.com" />
                        </label>

                        <label>
                          Priority
                          <input type="number" name="priority" min={0} max={1000} defaultValue={0} required />
                        </label>

                        <button className="btn btn-primary" type="submit">
                          <Plus size={16} />
                          Add Ad
                        </button>
                      </form>
                    </section>
                  </div>

                  <section className="panel" style={{ background: "#f9fbff", boxShadow: "none", padding: 14 }}>
                    <h3 style={{ marginBottom: 8 }}>
                      <BarChart size={16} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                      Creatives
                    </h3>
                    <div className="compact-list">
                      {app.ads.length === 0 ? (
                        <p>No ads yet.</p>
                      ) : (
                        app.ads.map((ad) => (
                          <div key={ad.id} className="compact-row">
                            <div>
                              <strong>{ad.title}</strong>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                <span className="badge">
                                  {ad.mediaType === "VIDEO" ? <Video size={12} /> : <Tv size={12} />} {ad.mediaType}
                                </span>
                                <span className="badge">
                                  <Gift size={12} /> {ad.rewardSeconds}s
                                </span>
                                <span className="badge">priority {ad.priority}</span>
                                <span className="badge">{ad.isActive ? "active" : "inactive"}</span>
                                <span className="badge">{ad.scope === "ALL_APPS" ? "all apps" : "app only"}</span>
                              </div>
                            </div>

                            <div className="compact-links">
                              {isSafeExternalUrl(ad.mediaUrl) ? (
                                <a className="mono" href={ad.mediaUrl} target="_blank" rel="noreferrer">
                                  media
                                </a>
                              ) : (
                                <span className="error">invalid media url</span>
                              )}
                              {ad.clickUrl ? (
                                isSafeExternalUrl(ad.clickUrl) ? (
                                  <a className="mono" href={ad.clickUrl} target="_blank" rel="noreferrer">
                                    click
                                  </a>
                                ) : (
                                  <span className="error">invalid click url</span>
                                )
                              ) : (
                                <span className="badge">
                                  <CircleX size={12} style={{ marginRight: 4 }} /> no click
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
