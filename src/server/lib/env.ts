const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const assertJwtSecret = (secret: string): string => {
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }

  return secret;
};

export const env = {
  jwtSecret: assertJwtSecret(requireEnv("JWT_SECRET")),
  superAdminEmail: requireEnv("SUPER_ADMIN_EMAIL"),
  superAdminPassword: requireEnv("SUPER_ADMIN_PASSWORD"),
};
