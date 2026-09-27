import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";

import {
  apiRateLimiter,
} from "./middleware/auth/rateLimit.middleware.js";

import { ENV } from "./config/env.js";

const app = express();

// Trust reverse proxy in production
if (ENV.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Disable Express technology disclosure
app.disable("x-powered-by");

// Security headers
app.use(helmet());

// Protect against HTTP Parameter Pollution
app.use(hpp());

// Global API rate limiting
app.use(apiRateLimiter);

// CORS
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Limit JSON request body size
app.use(
  express.json({
    limit: "100kb",
  })
);

// Basic route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hunza Premier League API is running",
  });
});

export default app;