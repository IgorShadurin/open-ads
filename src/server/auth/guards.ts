import type { Role } from "@prisma/client";

import { AppError } from "@/server/errors";
import { readSession } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const session = await readSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
};

export const requireSessionUser = async (): Promise<SessionUser> => {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    throw new AppError("Unauthorized", 401);
  }

  return sessionUser;
};

export const requireRole = (user: SessionUser, allowedRoles: Role[]): void => {
  if (!allowedRoles.includes(user.role)) {
    throw new AppError("Forbidden", 403);
  }
};
