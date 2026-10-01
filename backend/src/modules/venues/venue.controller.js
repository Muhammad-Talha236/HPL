import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// VENUE STATUS
// ======================================================

const VENUE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// MATCH STATUS
// ======================================================

const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
};

// ======================================================
// VENUE SELECT
// ======================================================

const venueSelect = {
  venue_id: true,
  name: true,
  region: true,
  district: true,
  city: true,
  address: true,
  capacity: true,
  surface_type: true,
  contact_phone: true,
  status: true,
  created_at: true,
  updated_at: true,
};

// ======================================================
// CREATE VENUE
// ======================================================

export const createVenue = async (
  req,
  res
) => {
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

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------
          // CHECK DUPLICATE VENUE
          // ------------------------------------------------

          const existingVenue =
            await tx.venue.findFirst({
              where: {
                name,
                city,
              },

              select: {
                venue_id: true,
              },
            });

          if (existingVenue) {
            throw new Error(
              "VENUE_ALREADY_EXISTS"
            );
          }

          // ------------------------------------------------
          // CREATE VENUE
          // ------------------------------------------------

          const venue =
            await tx.venue.create({
              data: {
                name,
                region,
                district,
                city,
                address,
                capacity:
                  capacity !== undefined
                    ? Number(capacity)
                    : undefined,
                surface_type,
                contact_phone,
                status:
                  VENUE_STATUS.ACTIVE,
              },

              select: venueSelect,
            });

          return venue;
        },
        {
          isolationLevel:
            "Serializable",
        }
      );

    // ----------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.VENUE_CREATED,

      entity_type:
        "VENUE",

      entity_id:
        result.venue_id,

      details: {
        name:
          result.name,

        city:
          result.city,
      },
    });

    return res.status(201).json({
      success: true,
      message:
        "Venue created successfully",
      data: result,
    });
  } catch (error) {
    // ----------------------------------------------------
    // DUPLICATE VENUE
    // ----------------------------------------------------

    if (
      error.message ===
      "VENUE_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A venue with this name already exists in this city",
      });
    }

    // ----------------------------------------------------
    // SERIALIZABLE CONFLICT
    // ----------------------------------------------------

    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Venue creation conflicted with another request. Please try again.",
      });
    }

    console.error(
      "Create venue error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the venue",
    });
  }
};

// ======================================================
// GET ALL VENUES
// ======================================================

export const getVenues = async (
  req,
  res
) => {
  try {
    const venues =
      await prisma.venue.findMany({
        select: venueSelect,

        orderBy: {
          created_at: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: venues,
    });
  } catch (error) {
    console.error(
      "Get venues error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching venues",
    });
  }
};

// ======================================================
// GET VENUE BY ID
// ======================================================

export const getVenueById = async (
  req,
  res
) => {
  try {
    const venueId =
      Number(
        req.params.venue_id
      );

    const venue =
      await prisma.venue.findUnique({
        where: {
          venue_id:
            venueId,
        },

        select: venueSelect,
      });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message:
          "Venue not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: venue,
    });
  } catch (error) {
    console.error(
      "Get venue error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the venue",
    });
  }
};

// ======================================================
// UPDATE VENUE
// ======================================================

export const updateVenue = async (
  req,
  res
) => {
  try {
    const venueId =
      Number(
        req.params.venue_id
      );

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

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------
          // FIND CURRENT VENUE
          // ------------------------------------------------

          const currentVenue =
            await tx.venue.findUnique({
              where: {
                venue_id:
                  venueId,
              },

              select: venueSelect,
            });

          if (!currentVenue) {
            throw new Error(
              "VENUE_NOT_FOUND"
            );
          }

          // ------------------------------------------------
          // BUILD UPDATE DATA
          // ------------------------------------------------

          const updateData = {
            ...(name !== undefined && {
              name,
            }),

            ...(region !== undefined && {
              region,
            }),

            ...(district !== undefined && {
              district,
            }),

            ...(city !== undefined && {
              city,
            }),

            ...(address !== undefined && {
              address,
            }),

            ...(capacity !== undefined && {
              capacity:
                Number(capacity),
            }),

            ...(surface_type !== undefined && {
              surface_type,
            }),

            ...(contact_phone !== undefined && {
              contact_phone,
            }),
          };

          // ------------------------------------------------
          // DETERMINE FINAL VALUES
          // ------------------------------------------------

          const finalName =
            name !== undefined
              ? name
              : currentVenue.name;

          const finalCity =
            city !== undefined
              ? city
              : currentVenue.city;

          // ------------------------------------------------
          // CHECK DUPLICATE VENUE
          // ------------------------------------------------

          if (
            finalName !==
              currentVenue.name ||
            finalCity !==
              currentVenue.city
          ) {
            const existingVenue =
              await tx.venue.findFirst({
                where: {
                  name:
                    finalName,

                  city:
                    finalCity,

                  venue_id: {
                    not:
                      venueId,
                  },
                },

                select: {
                  venue_id: true,
                },
              });

            if (existingVenue) {
              throw new Error(
                "VENUE_ALREADY_EXISTS"
              );
            }
          }

          // ------------------------------------------------
          // UPDATE VENUE
          // ------------------------------------------------

          const updateResult =
            await tx.venue.updateMany({
              where: {
                venue_id:
                  venueId,
              },

              data:
                updateData,
            });

          if (
            updateResult.count !==
            1
          ) {
            throw new Error(
              "VENUE_UPDATE_CONFLICT"
            );
          }

          // ------------------------------------------------
          // FETCH UPDATED VENUE
          // ------------------------------------------------

          const updatedVenue =
            await tx.venue.findUnique({
              where: {
                venue_id:
                  venueId,
              },

              select: venueSelect,
            });

          return {
            previousVenue:
              currentVenue,

            updatedVenue,
          };
        },
        {
          isolationLevel:
            "Serializable",
        }
      );

    // ----------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.VENUE_UPDATED,

      entity_type:
        "VENUE",

      entity_id:
        venueId,

      details: {
        previous_name:
          result.previousVenue
            .name,

        new_name:
          result.updatedVenue
            .name,

        previous_city:
          result.previousVenue
            .city,

        new_city:
          result.updatedVenue
            .city,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Venue updated successfully",
      data:
        result.updatedVenue,
    });
  } catch (error) {
    // ----------------------------------------------------
    // KNOWN ERRORS
    // ----------------------------------------------------

    if (
      error.message ===
      "VENUE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Venue not found",
      });
    }

    if (
      error.message ===
      "VENUE_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A venue with this name already exists in this city",
      });
    }

    if (
      error.message ===
      "VENUE_UPDATE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Venue was modified by another request. Please try again.",
      });
    }

    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Venue update conflicted with another request. Please try again.",
      });
    }

    console.error(
      "Update venue error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the venue",
    });
  }
};

// ======================================================
// DEACTIVATE VENUE
// ======================================================

export const deactivateVenue =
  async (
    req,
    res
  ) => {
    try {
      const venueId =
        Number(
          req.params.venue_id
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            // --------------------------------------------
            // FIND VENUE
            // --------------------------------------------

            const venue =
              await tx.venue.findUnique({
                where: {
                  venue_id:
                    venueId,
                },

                select: {
                  venue_id: true,
                  name: true,
                  status: true,
                },
              });

            if (!venue) {
              throw new Error(
                "VENUE_NOT_FOUND"
              );
            }

            if (
              venue.status ===
              VENUE_STATUS.INACTIVE
            ) {
              throw new Error(
                "VENUE_ALREADY_INACTIVE"
              );
            }

            // --------------------------------------------
            // CHECK ACTIVE/SCHEDULED MATCHES
            // --------------------------------------------

            const activeMatch =
              await tx.match.findFirst({
                where: {
                  venue_id:
                    venueId,

                  status: {
                    in: [
                      MATCH_STATUS.SCHEDULED,
                      MATCH_STATUS.LIVE,
                    ],
                  },
                },

                select: {
                  match_id: true,
                  status: true,
                },
              });

            if (activeMatch) {
              throw new Error(
                "VENUE_HAS_ACTIVE_MATCH"
              );
            }

            // --------------------------------------------
            // ATOMIC DEACTIVATION
            // --------------------------------------------

            const updateResult =
              await tx.venue.updateMany({
                where: {
                  venue_id:
                    venueId,

                  status:
                    VENUE_STATUS.ACTIVE,
                },

                data: {
                  status:
                    VENUE_STATUS.INACTIVE,
                },
              });

            if (
              updateResult.count !==
              1
            ) {
              throw new Error(
                "VENUE_DEACTIVATE_CONFLICT"
              );
            }

            const updatedVenue =
              await tx.venue.findUnique({
                where: {
                  venue_id:
                    venueId,
                },

                select: venueSelect,
              });

            return updatedVenue;
          },
          {
            isolationLevel:
              "Serializable",
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Venue deactivated successfully",
        data: result,
      });
    } catch (error) {
      // ----------------------------------------------
      // KNOWN ERRORS
      // ----------------------------------------------

      if (
        error.message ===
        "VENUE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Venue not found",
        });
      }

      if (
        error.message ===
        "VENUE_ALREADY_INACTIVE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Venue is already inactive",
        });
      }

      if (
        error.message ===
        "VENUE_HAS_ACTIVE_MATCH"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Venue cannot be deactivated because it is assigned to a scheduled or live match",
        });
      }

      if (
        error.message ===
        "VENUE_DEACTIVATE_CONFLICT"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Venue was modified by another request. Please try again.",
        });
      }

      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Venue deactivation conflicted with another request. Please try again.",
        });
      }

      console.error(
        "Deactivate venue error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while deactivating the venue",
      });
    }
  };

// ======================================================
// ACTIVATE VENUE
// ======================================================

export const activateVenue =
  async (
    req,
    res
  ) => {
    try {
      const venueId =
        Number(
          req.params.venue_id
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            // --------------------------------------------
            // FIND VENUE
            // --------------------------------------------

            const venue =
              await tx.venue.findUnique({
                where: {
                  venue_id:
                    venueId,
                },

                select: {
                  venue_id: true,
                  status: true,
                },
              });

            if (!venue) {
              throw new Error(
                "VENUE_NOT_FOUND"
              );
            }

            if (
              venue.status ===
              VENUE_STATUS.ACTIVE
            ) {
              throw new Error(
                "VENUE_ALREADY_ACTIVE"
              );
            }

            // --------------------------------------------
            // ATOMIC ACTIVATION
            // --------------------------------------------

            const updateResult =
              await tx.venue.updateMany({
                where: {
                  venue_id:
                    venueId,

                  status:
                    VENUE_STATUS.INACTIVE,
                },

                data: {
                  status:
                    VENUE_STATUS.ACTIVE,
                },
              });

            if (
              updateResult.count !==
              1
            ) {
              throw new Error(
                "VENUE_ACTIVATE_CONFLICT"
              );
            }

            const updatedVenue =
              await tx.venue.findUnique({
                where: {
                  venue_id:
                    venueId,
                },

                select: venueSelect,
              });

            return updatedVenue;
          },
          {
            isolationLevel:
              "Serializable",
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Venue activated successfully",
        data: result,
      });
    } catch (error) {
      // ----------------------------------------------
      // KNOWN ERRORS
      // ----------------------------------------------

      if (
        error.message ===
        "VENUE_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Venue not found",
        });
      }

      if (
        error.message ===
        "VENUE_ALREADY_ACTIVE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Venue is already active",
        });
      }

      if (
        error.message ===
        "VENUE_ACTIVATE_CONFLICT"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Venue was modified by another request. Please try again.",
        });
      }

      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Venue activation conflicted with another request. Please try again.",
        });
      }

      console.error(
        "Activate venue error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while activating the venue",
      });
    }
  };