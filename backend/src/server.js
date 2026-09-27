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

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/players", playerRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});