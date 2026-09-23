import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/database/prisma.js";
import { ROLES } from "../src/constants/roles.js";
import { USER_STATUS } from "../src/constants/statuses.js";

const createSuperAdmin = async () => {
  try {
    const email = "admin@hpl.com";
    const password = "ChangeMe123!";

    // Check whether Super Admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingAdmin) {
      console.log("Super Admin already exists.");
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create Super Admin
    const admin = await prisma.user.create({
      data: {
        name: "HPL Super Admin",
        email,
        password_hash,
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE,
      },
    });

    console.log("Super Admin created successfully.");
    console.log("User ID:", admin.user_id);
    console.log("Email:", admin.email);

  } catch (error) {
    console.error("Error creating Super Admin:", error);
  } finally {
    await prisma.$disconnect();
  }
};

createSuperAdmin();