import bcrypt from "bcryptjs";

const MIN_PASSWORD_LENGTH = 8;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validatePassword = (password: string): { ok: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push("Password must be at least 8 characters");
  }

  if (!/[a-z]/i.test(password)) {
    issues.push("Password must include a letter");
  }

  if (!/[0-9]/.test(password)) {
    issues.push("Password must include a number");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};

export const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 12);

export const verifyPassword = async (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
