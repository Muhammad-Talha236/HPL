import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";

const teamStaffSelect = {
  staff_id: true,
  team_id: true,
  name: true,
  role: true,
  phone: true,
  email: true,
  status: true,
  created_at: true,
  updated_at: true,
};

const teamKitSelect = {
  kit_id: true,
  team_id: true,
  kit_type: true,
  name: true,
  primary_color: true,
  secondary_color: true,
  image_url: true,
  status: true,
  created_at: true,
  updated_at: true,
};

const teamDocumentSelect = {
  document_id: true,
  team_id: true,
  title: true,
  category: true,
  file_url: true,
  file_name: true,
  mime_type: true,
  size_bytes: true,
  status: true,
  uploaded_by: true,
  created_at: true,
  updated_at: true,
  uploader: { select: { user_id: true, name: true, email: true } },
};

const sanitizeText = (value, maxLength = 255) => {
  if (value === undefined || value === null) return undefined;
  const cleaned = String(value).replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLength);
};

const parseTeamId = (value) => {
  const teamId = Number(value);
  return Number.isInteger(teamId) && teamId > 0 ? teamId : null;
};

const ensureTeamAccess = async (req, teamId) => {
  const team = await prisma.team.findUnique({
    where: { team_id: teamId },
    select: {
      team_id: true,
      name: true,
      owner_id: true,
      club_id: true,
      club: { select: { owner_id: true } },
    },
  });

  if (!team) {
    const error = new Error("Team not found");
    error.statusCode = 404;
    throw error;
  }

  // authenticate supplies a current database user. Keep a local guard so
  // these team-scoped endpoints cannot be used without that trusted context.
  if (
    !req.user ||
    req.user.status !== USER_STATUS.ACTIVE
  ) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  const allowed =
    req.user.role === ROLES.SUPER_ADMIN ||
    (req.user.role === ROLES.CLUB_OWNER &&
      team.club_id !== null &&
      team.club?.owner_id === req.user.user_id);

  if (!allowed) {
    const error = new Error("You do not have permission to manage this team");
    error.statusCode = 403;
    throw error;
  }

  return team;
};

const handleTeamAccessError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
};

export const listTeamStaff = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    if (!teamId) {
      return res.status(400).json({ success: false, message: "Invalid team ID" });
    }

    await ensureTeamAccess(req, teamId);

    const data = await prisma.teamStaff.findMany({
      where: { team_id: teamId },
      select: teamStaffSelect,
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const createTeamStaff = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    if (!teamId) {
      return res.status(400).json({ success: false, message: "Invalid team ID" });
    }

    await ensureTeamAccess(req, teamId);

    const name = sanitizeText(req.body?.name, 120);
    const role = sanitizeText(req.body?.role, 80);
    const phone = sanitizeText(req.body?.phone, 30);
    const email = sanitizeText(req.body?.email, 160);

    if (!name || !role) {
      return res.status(400).json({ success: false, message: "Name and role are required" });
    }

    const data = await prisma.teamStaff.create({
      data: {
        team_id: teamId,
        name,
        role,
        phone: phone || null,
        email: email || null,
        status: "ACTIVE",
      },
      select: teamStaffSelect,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const updateTeamStaff = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    const staffId = parseTeamId(req.params.staff_id);
    if (!teamId || !staffId) {
      return res.status(400).json({ success: false, message: "Invalid team or staff ID" });
    }

    await ensureTeamAccess(req, teamId);

    const existing = await prisma.teamStaff.findFirst({
      where: { staff_id: staffId, team_id: teamId },
      select: { staff_id: true },
    });

    if (!existing) return res.status(404).json({ success: false, message: "Staff record not found" });

    const updateData = {};
    const name = sanitizeText(req.body?.name, 120);
    const role = sanitizeText(req.body?.role, 80);
    const phone = sanitizeText(req.body?.phone, 30);
    const email = sanitizeText(req.body?.email, 160);
    const status = sanitizeText(req.body?.status, 30);

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (status) updateData.status = status;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: "Provide a valid update" });
    }

    const data = await prisma.teamStaff.update({
      where: { staff_id: staffId },
      data: updateData,
      select: teamStaffSelect,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const deleteTeamStaff = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    const staffId = parseTeamId(req.params.staff_id);
    if (!teamId || !staffId) {
      return res.status(400).json({ success: false, message: "Invalid team or staff ID" });
    }

    await ensureTeamAccess(req, teamId);

    const existing = await prisma.teamStaff.findFirst({
      where: { staff_id: staffId, team_id: teamId },
      select: { staff_id: true },
    });

    if (!existing) return res.status(404).json({ success: false, message: "Staff record not found" });

    const data = await prisma.teamStaff.update({
      where: { staff_id: staffId },
      data: { status: "INACTIVE" },
      select: teamStaffSelect,
    });

    return res.json({ success: true, data, message: "Staff assignment removed" });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const listTeamKits = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    if (!teamId) {
      return res.status(400).json({ success: false, message: "Invalid team ID" });
    }

    await ensureTeamAccess(req, teamId);

    const data = await prisma.teamKit.findMany({
      where: { team_id: teamId },
      select: teamKitSelect,
      orderBy: [{ kit_type: "asc" }],
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const createTeamKit = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    if (!teamId) {
      return res.status(400).json({ success: false, message: "Invalid team ID" });
    }

    await ensureTeamAccess(req, teamId);

    const kitType = sanitizeText(req.body?.kit_type, 30)?.toUpperCase();
    if (!kitType || !["HOME", "AWAY", "THIRD"].includes(kitType)) {
      return res.status(400).json({ success: false, message: "A valid kit type is required" });
    }

    const name = sanitizeText(req.body?.name, 120) || `${kitType} Kit`;
    const primaryColor = sanitizeText(req.body?.primary_color, 30);
    const secondaryColor = sanitizeText(req.body?.secondary_color, 30);
    const imageUrl = sanitizeText(req.body?.image_url, 500);

    const data = await prisma.teamKit.upsert({
      where: { team_id_kit_type: { team_id: teamId, kit_type: kitType } },
      update: {
        name,
        primary_color: primaryColor || null,
        secondary_color: secondaryColor || null,
        image_url: imageUrl || null,
        status: "ACTIVE",
      },
      create: {
        team_id: teamId,
        kit_type: kitType,
        name,
        primary_color: primaryColor || null,
        secondary_color: secondaryColor || null,
        image_url: imageUrl || null,
        status: "ACTIVE",
      },
      select: teamKitSelect,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const updateTeamKit = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    const kitId = parseTeamId(req.params.kit_id);
    if (!teamId || !kitId) {
      return res.status(400).json({ success: false, message: "Invalid team or kit ID" });
    }

    await ensureTeamAccess(req, teamId);

    const existing = await prisma.teamKit.findFirst({
      where: { kit_id: kitId, team_id: teamId },
      select: { kit_id: true },
    });

    if (!existing) return res.status(404).json({ success: false, message: "Kit record not found" });

    const updateData = {};
    const kitType = sanitizeText(req.body?.kit_type, 30)?.toUpperCase();
    const name = sanitizeText(req.body?.name, 120);
    const primaryColor = sanitizeText(req.body?.primary_color, 30);
    const secondaryColor = sanitizeText(req.body?.secondary_color, 30);
    const imageUrl = sanitizeText(req.body?.image_url, 500);
    const status = sanitizeText(req.body?.status, 30);

    if (kitType && ["HOME", "AWAY", "THIRD"].includes(kitType)) updateData.kit_type = kitType;
    if (name) updateData.name = name;
    if (primaryColor !== undefined) updateData.primary_color = primaryColor || null;
    if (secondaryColor !== undefined) updateData.secondary_color = secondaryColor || null;
    if (imageUrl !== undefined) updateData.image_url = imageUrl || null;
    if (status) updateData.status = status;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: "Provide valid kit data" });
    }

    const data = await prisma.teamKit.update({
      where: { kit_id: kitId },
      data: updateData,
      select: teamKitSelect,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const deleteTeamKit = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    const kitId = parseTeamId(req.params.kit_id);
    if (!teamId || !kitId) {
      return res.status(400).json({ success: false, message: "Invalid team or kit ID" });
    }

    await ensureTeamAccess(req, teamId);

    const existing = await prisma.teamKit.findFirst({
      where: { kit_id: kitId, team_id: teamId },
      select: { kit_id: true },
    });

    if (!existing) return res.status(404).json({ success: false, message: "Kit record not found" });

    const data = await prisma.teamKit.update({
      where: { kit_id: kitId },
      data: { status: "ARCHIVED" },
      select: teamKitSelect,
    });

    return res.json({ success: true, data, message: "Kit removed" });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const listTeamDocuments = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    if (!teamId) {
      return res.status(400).json({ success: false, message: "Invalid team ID" });
    }

    await ensureTeamAccess(req, teamId);

    const data = await prisma.teamDocument.findMany({
      where: { team_id: teamId, status: { not: "ARCHIVED" } },
      select: teamDocumentSelect,
      orderBy: [{ created_at: "desc" }],
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const createTeamDocument = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    if (!teamId) {
      return res.status(400).json({ success: false, message: "Invalid team ID" });
    }

    await ensureTeamAccess(req, teamId);

    const title = sanitizeText(req.body?.title, 180) || sanitizeText(req.body?.file_name, 180) || "Team document";
    const category = sanitizeText(req.body?.category, 80) || "General";
    const fileUrl = sanitizeText(req.body?.file_url, 500);
    const fileName = sanitizeText(req.body?.file_name, 180) || "document";
    const mimeType = sanitizeText(req.body?.mime_type, 80) || "application/octet-stream";
    const sizeBytes = Number(req.body?.size_bytes ?? 0);

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: "Document URL is required" });
    }

    const data = await prisma.teamDocument.create({
      data: {
        team_id: teamId,
        title,
        category,
        file_url: fileUrl,
        file_name: fileName,
        mime_type: mimeType,
        size_bytes: Number.isFinite(sizeBytes) && sizeBytes > 0 ? Math.round(sizeBytes) : null,
        uploaded_by: req.user?.user_id ?? 0,
      },
      select: teamDocumentSelect,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const updateTeamDocument = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    const documentId = parseTeamId(req.params.document_id);
    if (!teamId || !documentId) {
      return res.status(400).json({ success: false, message: "Invalid team or document ID" });
    }

    await ensureTeamAccess(req, teamId);

    const existing = await prisma.teamDocument.findFirst({
      where: { document_id: documentId, team_id: teamId },
      select: { document_id: true },
    });

    if (!existing) return res.status(404).json({ success: false, message: "Document not found" });

    const updateData = {};
    const title = sanitizeText(req.body?.title, 180);
    const category = sanitizeText(req.body?.category, 80);
    const status = sanitizeText(req.body?.status, 30);

    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (status) updateData.status = status;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: "Provide valid document data" });
    }

    const data = await prisma.teamDocument.update({
      where: { document_id: documentId },
      data: updateData,
      select: teamDocumentSelect,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};

export const deleteTeamDocument = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.team_id);
    const documentId = parseTeamId(req.params.document_id);
    if (!teamId || !documentId) {
      return res.status(400).json({ success: false, message: "Invalid team or document ID" });
    }

    await ensureTeamAccess(req, teamId);

    const existing = await prisma.teamDocument.findFirst({
      where: { document_id: documentId, team_id: teamId },
      select: { document_id: true },
    });

    if (!existing) return res.status(404).json({ success: false, message: "Document not found" });

    const data = await prisma.teamDocument.update({
      where: { document_id: documentId },
      data: { status: "ARCHIVED" },
      select: teamDocumentSelect,
    });

    return res.json({ success: true, data, message: "Document archive updated" });
  } catch (error) {
    return handleTeamAccessError(error, res, next);
  }
};
