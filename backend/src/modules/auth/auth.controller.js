import { normalizeStoredEmail, getEmailLookupKey, isValidAccountEmail } from "../../utils/email.util.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";

import { validatePassword } from "../../utils/password.util.js";
import { SECURITY } from "../../config/security.js";
import { ENV } from "../../config/env.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { createVerificationToken, getVerificationTokenHash, sendVerificationEmail } from "../../services/emailVerification.service.js";

// ============================================================
// REGISTER
// ============================================================

export const register = async (req, res) => {
  try {
    const {
      name,
      email: submittedEmail,
      password,
      phone,
    } = req.body;

    const email = normalizeStoredEmail(submittedEmail);
    if (!isValidAccountEmail(email)) return res.status(400).json({ success: false, message: "Please provide a valid email address" });

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
        email_key: getEmailLookupKey(email),
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account already exists for this email. Please log in or reset your password.",
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
    const verification = createVerificationToken();
    await prisma.emailVerificationToken.create({
      data: { user_id: user.user_id, token_hash: verification.tokenHash, email_snapshot: user.email, expires_at: verification.expiresAt },
    });
    let verificationMessage = "Check your account email to verify it before submitting an independent team application.";
    try {
      await sendVerificationEmail({ email: user.email, name: user.name, rawToken: verification.rawToken });
    } catch {
      verificationMessage = "Your account was created, but the verification email could not be sent. Sign in and request a new verification email.";
    }

    // 6. Never send password_hash to client
    const {
      password_hash: _,
      email_key: _emailKey,
      session_version: _sessionVersion,
      password_reset_requested_at: _resetRequestedAt,
      ...userWithoutPassword
    } = user;

    // 7. Send response
    return res.status(201).json({
      success: true,
      message: `User registered successfully. ${verificationMessage}`,
      data: userWithoutPassword,
    });

  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ success: false, message: "An account already exists for this email. Please log in or reset your password." });
    console.error("Registration failed", { code: error.code || "UNKNOWN" });

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
      email: submittedEmail,
      password,
    } = req.body;

    const email = normalizeStoredEmail(submittedEmail);
    if (!isValidAccountEmail(email)) return res.status(400).json({ success: false, message: "Please provide a valid email address" });

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
        email_key: getEmailLookupKey(email),
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
      session_version: user.session_version,
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
      email_key: _emailKey,
      session_version: _sessionVersion,
      password_reset_requested_at: _resetRequestedAt,
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
        location: true,
        date_of_birth: true,
        role: true,
        status: true,
        profile_image: true,
        email_verified: true,
        email_verified_at: true,
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

const accountSelect = {
  user_id: true,
  name: true,
  email: true,
  phone: true,
  location: true,
  date_of_birth: true,
  role: true,
  status: true,
  profile_image: true,
  email_verified: true,
  email_verified_at: true,
};

export const verifyEmail = async (req, res) => {
  const tokenHash = getVerificationTokenHash(req.query.token);
  if (!tokenHash) return res.status(400).json({ success: false, message: "This verification link is invalid or expired." });
  const token = await prisma.emailVerificationToken.findUnique({ where: { token_hash: tokenHash }, include: { user: { select: { user_id: true, email: true } } } });
  if (!token || token.used_at || token.expires_at <= new Date() || token.email_snapshot !== token.user.email) {
    return res.status(400).json({ success: false, message: "This verification link is invalid or expired." });
  }
  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({ where: { user_id: token.user_id, email: token.email_snapshot, email_verified: false }, data: { email_verified: true, email_verified_at: new Date() } });
    if (updated.count !== 1) throw new Error("EMAIL_VERIFICATION_CONFLICT");
    await tx.emailVerificationToken.updateMany({ where: { user_id: token.user_id, used_at: null }, data: { used_at: new Date() } });
  });
  return res.json({ success: true, message: "Email verified successfully. You can now submit an independent team application." });
};

export const resendEmailVerification = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { user_id: req.user.user_id }, select: { user_id: true, name: true, email: true, email_verified: true } });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.email_verified) return res.json({ success: true, message: "Your account email is already verified." });
  const recent = await prisma.emailVerificationToken.findFirst({ where: { user_id: user.user_id, created_at: { gt: new Date(Date.now() - 15 * 60 * 1000) } }, select: { email_verification_token_id: true } });
  if (recent) return res.status(429).json({ success: false, message: "A verification email was sent recently. Please wait before requesting another." });
  const verification = createVerificationToken();
  await prisma.emailVerificationToken.updateMany({ where: { user_id: user.user_id, used_at: null }, data: { used_at: new Date() } });
  await prisma.emailVerificationToken.create({ data: { user_id: user.user_id, token_hash: verification.tokenHash, email_snapshot: user.email, expires_at: verification.expiresAt } });
  await sendVerificationEmail({ email: user.email, name: user.name, rawToken: verification.rawToken });
  return res.json({ success: true, message: "A new verification email has been sent." });
};

// ============================================================
// UPDATE CURRENT USER PROFILE
// ============================================================

export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, location, date_of_birth } = req.body;
    const updateData = {
      name: name.trim(),
      phone: phone === undefined ? undefined : phone === null ? null : phone.trim(),
      location: location === undefined ? undefined : location === null ? null : location.trim(),
      date_of_birth: date_of_birth === undefined ? undefined : date_of_birth === null ? null : new Date(`${date_of_birth}T00:00:00.000Z`),
    };

    const user = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: updateData,
      select: accountSelect,
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
      entity_type: "USER",
      entity_id: req.user.user_id,
      details: {
        fields: Object.keys(updateData).filter(
          (field) => updateData[field] !== undefined,
        ),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update current user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating your profile",
    });
  }
};

// ============================================================
// CHANGE CURRENT USER PASSWORD
// ============================================================

export const changeMyPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: { user_id: true, password_hash: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      current_password,
      user.password_hash,
    );

    if (!currentPasswordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const isSamePassword = await bcrypt.compare(new_password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    const password_hash = await bcrypt.hash(
      new_password,
      SECURITY.BCRYPT_SALT_ROUNDS,
    );

    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: { password_hash },
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.USER_PASSWORD_CHANGED,
      entity_type: "USER",
      entity_id: req.user.user_id,
    });

    return res.status(200).json({
      success: true,
      message: "Credentials updated successfully",
    });
  } catch (error) {
    console.error("Change current user password error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while changing your password",
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
      ROLES.REFEREE,
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

    // Store old role for audit logging
    const oldRole = user.role;

    // 6. Update role
    const updatedUser = await prisma.user.update({
      where: {
        user_id: userId,
      },
      data: {
        role,
      },
    });

    // 7. Create audit log
    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.USER_ROLE_UPDATED,
      entity_type: "USER",
      entity_id: userId,
      details: {
        old_role: oldRole,
        new_role: role,
      },
    });

    // 8. Never send password_hash
    const {
      password_hash: _,
      email_key: _emailKey,
      session_version: _sessionVersion,
      password_reset_requested_at: _resetRequestedAt,
      ...userWithoutPassword
    } = updatedUser;

    // 9. Send response
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
