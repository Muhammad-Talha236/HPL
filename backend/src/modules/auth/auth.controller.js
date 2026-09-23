import bcrypt from "bcryptjs";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";
import jwt from "jsonwebtoken";

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

    // 2. Check whether email already exists
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

    // 3. Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Create the user
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

    // 5. Never send password_hash to the client
    const { password_hash: _, ...userWithoutPassword } = user;

    // 6. Send response
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

    // 3. Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Check whether the account is active
    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // 5. Compare entered password with hashed password
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

    // 6. Create JWT payload
    const tokenPayload = {
      user_id: user.user_id,
      role: user.role,
    };

    // 7. Generate JWT
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    // 8. Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

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

export const getMe = async (req, res) => {
  try {
    // req.user comes from authenticate middleware
    const user = await prisma.user.findUnique({
      where: {
        user_id: req.user.user_id,
      },
    });

    // User no longer exists in database
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Never return password_hash
    const { password_hash: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });

  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching user",
    });
  }
};