import { redirect } from "next/navigation";

import { getSessionUser } from "@/server/auth/guards";
import { listAppsForUser } from "@/server/services/portal";

import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const apps = await listAppsForUser(user.id, user.role);

  return (
    <DashboardClient
      initialApps={JSON.parse(JSON.stringify(apps))}
      sessionUser={{ id: user.id, email: user.email, role: user.role }}
    />
  );
}
