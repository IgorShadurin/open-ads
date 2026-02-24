import { ArrowRight, BarChart3, Gift, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/server/auth/guards";

export default async function HomePage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="grid" style={{ gap: 20 }}>
      <div className="hero">
        <div className="panel" style={{ padding: 28 }}>
          <span className="badge">iOS 18+ Rewarded Ads</span>
          <h1 style={{ marginTop: 12 }}>Fast, predictable ad delivery for your iOS portfolio.</h1>
          <p>
            OpenAds gives each account isolated apps, ads, and analytics while keeping delivery rules strict by
            bundle identifier.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-primary">
              <ArrowRight size={16} />
              Open Portal
            </Link>
            <Link href="/register" className="btn btn-secondary">
              <ShieldCheck size={16} />
              Request Access
            </Link>
          </div>
        </div>

        <div className="grid">
          <div className="panel">
            <h3>
              <Smartphone size={18} style={{ verticalAlign: "text-bottom", marginRight: 6 }} /> SDK Endpoint
            </h3>
            <p>Apps request ad content by `bundleId`. Unknown apps are rejected immediately.</p>
          </div>
          <div className="panel">
            <h3>
              <Gift size={18} style={{ verticalAlign: "text-bottom", marginRight: 6 }} /> Rewarded Flow
            </h3>
            <p>Track shown/canceled/rewarded events with configurable durations (default 15s).</p>
          </div>
          <div className="panel">
            <h3>
              <BarChart3 size={18} style={{ verticalAlign: "text-bottom", marginRight: 6 }} /> Built-in Stats
            </h3>
            <p>View app initialization and ad event counters across every owned app.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
