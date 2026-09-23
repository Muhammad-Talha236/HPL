import express from "express";
import { register, login, getMe } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);



export default router;