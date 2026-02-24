import { Role } from "@prisma/client";

import { hashPassword, normalizeEmail, validatePassword, verifyPassword } from "@/server/domain/auth";
import { AppError } from "@/server/errors";
import { prisma } from "@/server/prisma";
import { getRegistrationState } from "@/server/services/registration";

export const registerUser = async (input: { email: string; password: string }) => {
  const isRegistrationOpen = await getRegistrationState();

  if (!isRegistrationOpen) {
    throw new AppError("Registration is closed", 403);
  }

  const email = normalizeEmail(input.email);
  const passwordStatus = validatePassword(input.password);

  if (!passwordStatus.ok) {
    throw new AppError(passwordStatus.issues.join(", "), 422);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.USER,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  return created;
};

export const loginUser = async (input: { email: string; password: string }) => {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const matches = await verifyPassword(input.password, user.passwordHash);

  if (!matches) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
};
