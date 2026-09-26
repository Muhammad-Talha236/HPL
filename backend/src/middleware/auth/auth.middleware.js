import jwt from "jsonwebtoken";
import prisma from "../../database/prisma.js";
import { USER_STATUS } from "../../constants/statuses.js";

export const authenticate = async (req, res, next) => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check Authorization header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    // 3. Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication format",
      });
    }

    // 4. Extract token
    const token = authHeader.substring(7).trim();

    // 5. Make sure token is not empty
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    // 6. Make sure JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured",
      });
    }

    // 7. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // 8. Validate user ID from token
    if (!decoded.user_id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // 9. Get current user from database
    const user = await prisma.user.findUnique({
      where: {
        user_id: decoded.user_id,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        profile_image: true,
      },
    });

    // 10. User does not exist anymore
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
    }

    // 11. Check current account status
    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // 12. Store trusted database user
    req.user = user;

    // 13. Continue
    next();

  } catch (error) {
    // Invalid or expired JWT
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    // Unexpected error
    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication service temporarily unavailable",
    });
  }
};