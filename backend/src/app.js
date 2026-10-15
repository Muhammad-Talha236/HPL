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
    origin(origin, callback) {
      // Requests without an Origin header are non-browser/server-to-server
      // requests and remain valid. Browser origins must be explicitly allowed.
      if (!origin || ENV.FRONTEND_URLS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin is not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Registration uploads have a dedicated authenticated route and server content checks.
app.use(["/api/registrations/receipt-upload", "/api/registrations/image-upload"], express.json({ limit: "7mb" }));

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