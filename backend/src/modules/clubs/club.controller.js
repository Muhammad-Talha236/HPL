import prisma from "../../database/prisma.js";

export const createClub = async (req, res) => {
  try {
    const {
      name,
      logo,
      description,
      region,
      district,
      city,
      contact_email,
      contact_phone,
      representative_name,
    } = req.body;

    // 1. Validate required field
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Club name is required",
      });
    }

    // 2. Get authenticated user's ID from JWT
    const owner_id = req.user.user_id;

    // 3. Check for duplicate club name
    const existingClub = await prisma.club.findFirst({
      where: {
        name,
      },
    });

    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: "A club with this name already exists",
      });
    }

    // 4. Create club
    const club = await prisma.club.create({
      data: {
        owner_id,
        name,
        logo,
        description,
        region,
        district,
        city,
        contact_email,
        contact_phone,
        representative_name,
        status: "ACTIVE",
      },
    });

    // 5. Return created club
    return res.status(201).json({
      success: true,
      message: "Club created successfully",
      data: club,
    });

  } catch (error) {
    console.error("Create club error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the club",
    });
  }
};