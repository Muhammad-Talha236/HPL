import "dotenv/config";

import app from "./app.js";

import prisma from "./database/prisma.js";

import authRoutes from "./modules/auth/auth.routes.js";
import clubRoutes from "./modules/clubs/club.routes.js";
import teamRoutes from "./modules/teams/team.routes.js";
import venueRoutes from "./modules/venues/venue.routes.js";
import playerRoutes from "./modules/players/player.routes.js";

import { errorHandler } from "./middleware/auth/error.middleware.js";
import { ENV } from "./config/env.js";

import auditLogRoutes from "./modules/auditLogs/auditLog.routes.js";
import seasonRoutes from "./modules/seasons/season.routes.js";
import competitionRoutes from "./modules/competitions/competition.routes.js";
import registrationRoutes from "./modules/registrations/registration.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import registrationRoutes from "./modules/registrations/registration.routes.js";
import matchRoutes from "./modules/matches/match.routes.js";
import matchPlayerRoutes from "./modules/matchPlayers/matchPlayer.routes.js";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/referees", refereeRoutes);
app.use(
  "/api/matches",
  matchRoutes
);
app.use("/api/match-players", matchPlayerRoutes);
// Database test route
// Database test route - development only
if (ENV.NODE_ENV === "development") {
  app.get("/api/test-db", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return res.json({
        success: true,
        message: "Neon database connected successfully!",
      });
    } catch (error) {
      console.error("Database connection error:", error);

      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }
  });
}

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT} (${ENV.NODE_ENV})`
  );
});


// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down server...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();

      console.log("Database connection closed.");
      process.exit(0);
    } catch (error) {
      console.error(
        "Error while closing database connection:",
        error
      );

      process.exit(1);
    }
  });
};


// Handle termination signals
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});