import "dotenv/config";

import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set("sslmode", "verify-full");

const pool = new pg.Pool({
  connectionString: databaseUrl.toString(),
});

const adapter = new PrismaPg(pool, {
  disposeExternalPool: true,
  onPoolError: (error) => {
    console.error("PostgreSQL pool error:", error);
  },
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;