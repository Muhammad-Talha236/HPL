const requiredEnvVariables = [
  "DATABASE_URL",
  "JWT_SECRET",
];


// ======================================================
// REQUIRED ENVIRONMENT VARIABLES
// ======================================================

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}


// ======================================================
// JWT SECRET SECURITY
// ======================================================

// JWT secret must be at least 32 characters
if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters long"
  );
}


// ======================================================
// NODE ENVIRONMENT
// ======================================================

const NODE_ENV =
  process.env.NODE_ENV || "development";

if (
  !["development", "production", "test"].includes(
    NODE_ENV
  )
) {
  throw new Error(
    "NODE_ENV must be development, production, or test"
  );
}


// ======================================================
// PRODUCTION FRONTEND URL
// ======================================================

if (
  NODE_ENV === "production" &&
  !process.env.FRONTEND_URL
) {
  throw new Error(
    "FRONTEND_URL is required in production"
  );
}


// ======================================================
// PORT VALIDATION
// ======================================================

const PORT = Number(
  process.env.PORT || 5000
);

if (
  !Number.isInteger(PORT) ||
  PORT < 1 ||
  PORT > 65535
) {
  throw new Error(
    "PORT must be a valid number between 1 and 65535"
  );
}


// ======================================================
// PRODUCTION DATABASE SECURITY
// ======================================================

if (
  NODE_ENV === "production" &&
  !process.env.DATABASE_URL.startsWith("postgres")
) {
  throw new Error(
    "Production DATABASE_URL must use PostgreSQL"
  );
}


// ======================================================
// EXPORT ENVIRONMENT CONFIG
// ======================================================

export const ENV = {
  PORT,

  NODE_ENV,

  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    (NODE_ENV === "development"
      ? "http://localhost:5173"
      : ""),

  JWT_SECRET:
    process.env.JWT_SECRET,

  JWT_EXPIRES_IN:
    process.env.JWT_EXPIRES_IN || "7d",
};