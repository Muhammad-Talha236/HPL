import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Protect login from brute-force attacks
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum login attempts per IP
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again later.",
  },
});

// General API protection
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum API requests per IP
  limit: 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

// Signed uploads are intentionally much tighter than ordinary API traffic.
// A signature is short-lived, but limiting their issuance also protects the
// Cloudinary account from automated upload abuse.
export const mediaUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.user_id ?? ipKeyGenerator(req.ip)),
  message: { success: false, message: "Too many media upload attempts. Please try again later." },
});

export const playerInvitationAcceptanceRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many invitation attempts. Please try again later." },
});

export const playerInvitationResendRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => `${req.user?.user_id ?? "anonymous"}:${req.params.invitation_id ?? ""}`,
  message: { success: false, message: "Too many invitation resend attempts. Please try again later." },
});

// Per-invitation throttling prevents repeated delivery to one recipient; this
// companion limiter prevents an inviter from bypassing it across many records.
export const playerInvitationResendActorRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.user_id ?? "anonymous"),
  message: { success: false, message: "Too many invitation resend attempts. Please try again later." },
});
