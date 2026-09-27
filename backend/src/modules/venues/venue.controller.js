import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";


// ======================================================
// CREATE VENUE
// ======================================================

export const createVenue = async (req, res) => {
  try {
    const {
      name,
      region,
      district,
      city,
      address,
      capacity,
      surface_type,
      contact_phone,
    } = req.body;

    if (!name || !region || !district || !city || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, region, district, city and address are required",
      });
    }

    if (
      capacity !== undefined &&
      (!Number.isInteger(Number(capacity)) || Number(capacity) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a valid non-negative number",
      });
    }

    const existingVenue = await prisma.venue.findFirst({
      where: {
        name,
        city,
      },
    });

    if (existingVenue) {
      return res.status(409).json({
        success: false,
        message: "A venue with this name already exists in this city",
      });
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        region,
        district,
        city,
        address,
        capacity:
          capacity !== undefined ? Number(capacity) : undefined,
        surface_type,
        contact_phone,
        status: "ACTIVE",
      },
    });

    // Create audit log
    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.VENUE_CREATED,
      entity_type: "VENUE",
      entity_id: venue.venue_id,
      details: {
        name: venue.name,
        city: venue.city,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Venue created successfully",
      data: venue,
    });
  } catch (error) {
    console.error("Create venue error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the venue",
    });
  }
};


// ======================================================
// GET ALL VENUES
// ======================================================

export const getVenues = async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: venues,
    });
  } catch (error) {
    console.error("Get venues error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching venues",
    });
  }
};


// ======================================================
// GET VENUE BY ID
// ======================================================

export const getVenueById = async (req, res) => {
  try {
    const venueId = Number(req.params.venue_id);

    if (!Number.isInteger(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await prisma.venue.findUnique({
      where: {
        venue_id: venueId,
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: venue,
    });
  } catch (error) {
    console.error("Get venue error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the venue",
    });
  }
};


// ======================================================
// UPDATE VENUE
// ======================================================

export const updateVenue = async (req, res) => {
  try {
    const venueId = Number(req.params.venue_id);

    if (!Number.isInteger(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await prisma.venue.findUnique({
      where: {
        venue_id: venueId,
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    const {
      name,
      region,
      district,
      city,
      address,
      capacity,
      surface_type,
      contact_phone,
    } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Venue name cannot be empty",
      });
    }

    if (
      capacity !== undefined &&
      (!Number.isInteger(Number(capacity)) || Number(capacity) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a valid non-negative number",
      });
    }

    const updatedVenue = await prisma.venue.update({
      where: {
        venue_id: venueId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(region !== undefined && { region }),
        ...(district !== undefined && { district }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        ...(capacity !== undefined && {
          capacity: Number(capacity),
        }),
        ...(surface_type !== undefined && { surface_type }),
        ...(contact_phone !== undefined && { contact_phone }),
      },
    });

    // Create audit log
    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.VENUE_UPDATED,
      entity_type: "VENUE",
      entity_id: venueId,
      details: {
        previous_name: venue.name,
        new_name: updatedVenue.name,
        previous_city: venue.city,
        new_city: updatedVenue.city,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Venue updated successfully",
      data: updatedVenue,
    });
  } catch (error) {
    console.error("Update venue error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the venue",
    });
  }
};


// ======================================================
// DEACTIVATE VENUE
// ======================================================

export const deactivateVenue = async (req, res) => {
  try {
    const venueId = Number(req.params.venue_id);

    if (!Number.isInteger(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await prisma.venue.findUnique({
      where: {
        venue_id: venueId,
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    if (venue.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Venue is already inactive",
      });
    }

    const updatedVenue = await prisma.venue.update({
      where: {
        venue_id: venueId,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Venue deactivated successfully",
      data: updatedVenue,
    });
  } catch (error) {
    console.error("Deactivate venue error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deactivating the venue",
    });
  }
};


// ======================================================
// ACTIVATE VENUE
// ======================================================

export const activateVenue = async (req, res) => {
  try {
    const venueId = Number(req.params.venue_id);

    if (!Number.isInteger(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const venue = await prisma.venue.findUnique({
      where: {
        venue_id: venueId,
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    if (venue.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Venue is already active",
      });
    }

    const updatedVenue = await prisma.venue.update({
      where: {
        venue_id: venueId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Venue activated successfully",
      data: updatedVenue,
    });
  } catch (error) {
    console.error("Activate venue error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while activating the venue",
    });
  }
};