import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getSessionUser, requireRole } from "@/server/auth/guards";
import { getRegistrationState } from "@/server/services/registration";

import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  requireRole(user, [Role.SUPER_ADMIN]);
  const isRegistrationOpen = await getRegistrationState();

  return <AdminClient initialRegistrationOpen={isRegistrationOpen} />;
}
