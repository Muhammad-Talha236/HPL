import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";

import { validatePassword } from "../../utils/password.util.js";
import { SECURITY } from "../../config/security.js";
import { ENV } from "../../config/env.js";

// ============================================================
// REGISTER
// ============================================================

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // 2. Validate password strength
    const passwordValidation = validatePassword(password);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // 3. Check whether email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // 4. Hash password
    const password_hash = await bcrypt.hash(
      password,
      SECURITY.BCRYPT_SALT_ROUNDS
    );

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        phone,
        role: ROLES.USER,
        status: USER_STATUS.ACTIVE,
      },
    });

    // 6. Never send password_hash to client
    const {
      password_hash: _,
      ...userWithoutPassword
    } = user;

    // 7. Send response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userWithoutPassword,
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering user",
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

export const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // 3. Use the same message whether email exists or not
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Check account status
    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // 5. Compare password with stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 6. JWT payload
    const tokenPayload = {
      user_id: user.user_id,
      role: user.role,
    };

    // 7. Generate JWT
    const token = jwt.sign(
      tokenPayload,
      ENV.JWT_SECRET,
      {
        expiresIn: ENV.JWT_EXPIRES_IN,
      }
    );

    // 8. Never send password_hash
    const {
      password_hash: _,
      ...userWithoutPassword
    } = user;

    // 9. Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================

export const getMe = async (req, res) => {
  try {
    // req.user comes from authentication middleware
    const user = await prisma.user.findUnique({
      where: {
        user_id: req.user.user_id,
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

    // User no longer exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // password_hash is never fetched
    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching user",
    });
  }
};

// ============================================================
// UPDATE USER ROLE
// ============================================================

export const updateUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.user_id);
    const { role } = req.body;

    // 1. Validate role
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.CLUB_OWNER,
      ROLES.TEAM_OWNER,
      ROLES.USER,
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // 2. Prevent Super Admin from changing their own role
    if (userId === req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // 3. Find target user
    const user = await prisma.user.findUnique({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4. Prevent modifying an existing Super Admin
if (user.role === ROLES.SUPER_ADMIN) {
  return res.status(403).json({
    success: false,
    message:
      "SUPER_ADMIN account cannot be modified through this endpoint",
  });
}

// 5. Prevent creating a new Super Admin
if (role === ROLES.SUPER_ADMIN) {
  return res.status(403).json({
    success: false,
    message:
      "SUPER_ADMIN role cannot be assigned through this endpoint",
  });
}

    // 4. Update role
    const updatedUser = await prisma.user.update({
      where: {
        user_id: userId,
      },
      data: {
        role,
      },
    });

    // 5. Never send password_hash
    const {
      password_hash: _,
      ...userWithoutPassword
    } = updatedUser;

    // 6. Send response
    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: userWithoutPassword,
    });

  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating user role",
    });
  }
};