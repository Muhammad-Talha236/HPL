import cloudinary from "../../config/cloudinary.js";
import prisma from "../../database/prisma.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { DIRECT_MEDIA_ROLES, ENTITY_TYPES, RESOURCE_TYPES } from "./media.constants.js";
import {
  assertEntityExists,
  attachDirectMediaUrl,
  clearDirectMediaUrl,
  createUploadIntent,
  toMediaRecord,
  verifyCloudinaryAsset,
} from "./media.service.js";

const mediaSelect = {
  media_id: true, cloudinary_public_id: true, secure_url: true, resource_type: true, mime_type: true,
  original_filename: true, bytes: true, width: true, height: true, duration: true, folder: true,
  title: true, description: true, alt_text: true, status: true, created_at: true, updated_at: true,
  uploaded_by: { select: { user_id: true, name: true } },
  _count: { select: { attachments: true, home_gallery_items: true } },
};

const text = (value, maxLength) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const cleaned = String(value).replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createSignature = async (req, res, next) => {
  try {
    const { category, resource_type: resourceType } = req.body || {};
    const upload = await createUploadIntent({ userId: req.user.user_id, category, resourceType });
    if (!upload) return res.status(400).json({ success: false, message: "Unsupported media category or resource type" });
    return res.status(201).json({ success: true, data: upload });
  } catch (error) { next(error); }
};

// This route deliberately does not accept a client-selected category.  A
// normal user can create an upload intent only for their own profile image.
export const createOwnProfileSignature = async (req, res, next) => {
  req.body = { category: "profiles", resource_type: "image" };
  return createSignature(req, res, next);
};

export const registerMedia = async (req, res, next) => {
  try {
    const isOwnProfileMedia = req.isOwnProfileMedia === true;
    const intentId = String(req.body?.upload_intent_id || "");
    const publicId = String(req.body?.public_id || "");
    const assetId = String(req.body?.asset_id || "");
    const version = req.body?.version;
    const reportedResourceType = String(req.body?.resource_type || "");
    if (!assetId || !Number.isSafeInteger(Number(version)) || !RESOURCE_TYPES.has(reportedResourceType)) {
      return res.status(400).json({ success: false, message: "The Cloudinary upload result is incomplete" });
    }
    const intent = await prisma.mediaUploadIntent.findUnique({ where: { upload_intent_id: intentId } });
    if (!intent || intent.user_id !== req.user.user_id || intent.consumed_at || intent.expires_at <= new Date()) {
      return res.status(400).json({ success: false, message: "This upload authorization is invalid or has expired" });
    }
    if (isOwnProfileMedia && (intent.category !== "profiles" || intent.resource_type !== "image")) {
      return res.status(400).json({ success: false, message: "This upload authorization cannot be used for a profile image" });
    }

    const existing = await prisma.media.findUnique({ where: { cloudinary_public_id: publicId }, select: { media_id: true } });
    if (existing) return res.status(409).json({ success: false, message: "This Cloudinary asset is already registered" });

    let verified;
    try { verified = await verifyCloudinaryAsset({ intent, publicId, assetId, version, reportedResourceType }); }
    catch (error) { return res.status(400).json({ success: false, message: error.message }); }

    const media = await prisma.$transaction(async (tx) => {
      const consumed = await tx.mediaUploadIntent.updateMany({ where: { upload_intent_id: intentId, consumed_at: null }, data: { consumed_at: new Date() } });
      if (consumed.count !== 1) throw new Error("This upload authorization has already been used");
      const media = await tx.media.create({ data: toMediaRecord({ asset: verified.asset, format: verified.format, intent, metadata: req.body || {}, userId: req.user.user_id }), select: mediaSelect });
      if (isOwnProfileMedia) {
        // Replacing a profile image only removes the old attachment.  The old
        // Cloudinary asset remains managed and is never deleted implicitly.
        await tx.mediaAttachment.deleteMany({ where: { entity_type: "USER", entity_id: req.user.user_id, role: "PROFILE" } });
        await tx.mediaAttachment.create({ data: { media_id: media.media_id, entity_type: "USER", entity_id: req.user.user_id, role: "PROFILE" } });
        await tx.user.update({ where: { user_id: req.user.user_id }, data: { profile_image: media.secure_url } });
      }
      return media;
    });

    await createAuditLog({ actor_user_id: req.user.user_id, action: "MEDIA_REGISTERED", entity_type: "MEDIA", entity_id: media.media_id, details: { resource_type: media.resource_type, folder: media.folder } });
    return res.status(201).json({ success: true, data: media });
  } catch (error) {
    if (error.message === "This upload authorization has already been used") return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

export const registerOwnProfileMedia = async (req, res, next) => {
  req.isOwnProfileMedia = true;
  return registerMedia(req, res, next);
};

export const listMedia = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const q = String(req.query.q || "").trim().slice(0, 100);
    const resourceType = String(req.query.resource_type || "");
    const where = {
      status: "ACTIVE",
      ...(RESOURCE_TYPES.has(resourceType) ? { resource_type: resourceType } : {}),
      ...(q ? { OR: ["title", "original_filename", "alt_text"].map((field) => ({ [field]: { contains: q, mode: "insensitive" } })) } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.media.findMany({ where, select: mediaSelect, orderBy: { created_at: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.media.count({ where }),
    ]);
    return res.json({ success: true, data, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export const getMedia = async (req, res, next) => {
  try {
    const mediaId = parseId(req.params.media_id);
    if (!mediaId) return res.status(400).json({ success: false, message: "Invalid media ID" });
    const media = await prisma.media.findUnique({ where: { media_id: mediaId }, select: { ...mediaSelect, attachments: true, home_gallery_items: true } });
    if (!media || media.status !== "ACTIVE") return res.status(404).json({ success: false, message: "Media not found" });
    return res.json({ success: true, data: media });
  } catch (error) { next(error); }
};

export const updateMedia = async (req, res, next) => {
  try {
    const mediaId = parseId(req.params.media_id);
    if (!mediaId) return res.status(400).json({ success: false, message: "Invalid media ID" });
    const data = {};
    for (const [field, limit] of [["title", 160], ["description", 2000], ["alt_text", 240]]) {
      const value = text(req.body?.[field], limit);
      if (value !== undefined) data[field] = value;
    }
    if (!Object.keys(data).length) return res.status(400).json({ success: false, message: "Provide title, description, or alt text" });
    const media = await prisma.media.update({ where: { media_id: mediaId }, data, select: mediaSelect });
    await createAuditLog({ actor_user_id: req.user.user_id, action: "MEDIA_UPDATED", entity_type: "MEDIA", entity_id: mediaId, details: { fields: Object.keys(data) } });
    return res.json({ success: true, data: media });
  } catch (error) { if (error.code === "P2025") return res.status(404).json({ success: false, message: "Media not found" }); next(error); }
};

export const attachMedia = async (req, res, next) => {
  try {
    const mediaId = parseId(req.params.media_id);
    const entityId = parseId(req.body?.entity_id);
    const entityType = String(req.body?.entity_type || "").toUpperCase();
    const role = String(req.body?.role || "GALLERY").toUpperCase();
    if (!mediaId || !entityId || !ENTITY_TYPES.has(entityType)) return res.status(400).json({ success: false, message: "Invalid media attachment target" });
    const [media, exists] = await Promise.all([
      prisma.media.findUnique({ where: { media_id: mediaId } }),
      assertEntityExists(entityType, entityId),
    ]);
    if (!media || media.status !== "ACTIVE") return res.status(404).json({ success: false, message: "Media not found" });
    if (!exists) return res.status(404).json({ success: false, message: "Attachment target not found" });
    if (DIRECT_MEDIA_ROLES[entityType] === role && media.resource_type !== "image") return res.status(400).json({ success: false, message: "Profile, logo, and cover media must be images" });

    await prisma.$transaction(async (tx) => {
      await tx.mediaAttachment.upsert({
        where: { media_id_entity_type_entity_id_role: { media_id: mediaId, entity_type: entityType, entity_id: entityId, role } },
        create: {
          media_id: mediaId,
          entity_type: entityType,
          entity_id: entityId,
          role,
          display_order: await tx.mediaAttachment.count({ where: { entity_type: entityType, entity_id: entityId, role } }),
        },
        update: {},
      });
      await attachDirectMediaUrl(tx, { entityType, entityId, role, secureUrl: media.secure_url });
    });
    await createAuditLog({ actor_user_id: req.user.user_id, action: "MEDIA_ATTACHED", entity_type: entityType, entity_id: entityId, details: { media_id: mediaId, role } });
    return res.status(201).json({ success: true, message: "Media attached" });
  } catch (error) { next(error); }
};

export const detachMedia = async (req, res, next) => {
  try {
    const mediaId = parseId(req.params.media_id);
    const entityId = parseId(req.body?.entity_id);
    const entityType = String(req.body?.entity_type || "").toUpperCase();
    const role = String(req.body?.role || "GALLERY").toUpperCase();
    if (!mediaId || !entityId || !ENTITY_TYPES.has(entityType)) return res.status(400).json({ success: false, message: "Invalid media attachment target" });
    const media = await prisma.media.findUnique({ where: { media_id: mediaId } });
    if (!media) return res.status(404).json({ success: false, message: "Media not found" });
    await prisma.$transaction(async (tx) => {
      await clearDirectMediaUrl(tx, { entityType, entityId, role, secureUrl: media.secure_url });
      await tx.mediaAttachment.deleteMany({ where: { media_id: mediaId, entity_type: entityType, entity_id: entityId, role } });
    });
    return res.json({ success: true, message: "Media detached" });
  } catch (error) { next(error); }
};

const getAttachmentTarget = (req) => ({
  entityType: String(req.params.entity_type || req.body?.entity_type || "").toUpperCase(),
  entityId: parseId(req.params.entity_id || req.body?.entity_id),
});

export const listEntityMedia = async (req, res, next) => {
  try {
    const { entityType, entityId } = getAttachmentTarget(req);
    if (!entityId || !ENTITY_TYPES.has(entityType)) {
      return res.status(400).json({ success: false, message: "Invalid media target" });
    }
    const data = await prisma.mediaAttachment.findMany({
      where: { entity_type: entityType, entity_id: entityId, role: "GALLERY", media: { status: "ACTIVE" } },
      orderBy: [{ display_order: "asc" }, { created_at: "asc" }, { attachment_id: "asc" }],
      select: {
        attachment_id: true, display_order: true, is_published: true, role: true, created_at: true,
        media: {
          select: {
            media_id: true, secure_url: true, resource_type: true, mime_type: true,
            title: true, description: true, alt_text: true, width: true, height: true, duration: true,
          },
        },
      },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const updateAttachment = async (req, res, next) => {
  try {
    const attachmentId = parseId(req.params.attachment_id);
    if (!attachmentId || typeof req.body?.is_published !== "boolean") {
      return res.status(400).json({ success: false, message: "A valid attachment and publication value are required" });
    }
    const existing = await prisma.mediaAttachment.findUnique({ where: { attachment_id: attachmentId }, select: { role: true } });
    if (!existing || existing.role !== "GALLERY") {
      return res.status(404).json({ success: false, message: "Gallery attachment not found" });
    }
    const attachment = await prisma.mediaAttachment.update({
      where: { attachment_id: attachmentId },
      data: { is_published: req.body.is_published },
      select: { attachment_id: true, display_order: true, is_published: true },
    });
    return res.json({ success: true, data: attachment });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Media attachment not found" });
    return next(error);
  }
};

export const reorderEntityMedia = async (req, res, next) => {
  try {
    const { entityType, entityId } = getAttachmentTarget(req);
    const attachmentIds = req.body?.attachment_ids;
    const normalizedIds = Array.isArray(attachmentIds) ? attachmentIds.map(parseId) : [];
    if (!entityId || !ENTITY_TYPES.has(entityType) || !Array.isArray(attachmentIds) || normalizedIds.some((id) => !id) || new Set(normalizedIds).size !== normalizedIds.length) {
      return res.status(400).json({ success: false, message: "Provide a unique ordered list of attachment IDs" });
    }
    if (!await assertEntityExists(entityType, entityId)) {
      return res.status(404).json({ success: false, message: "Attachment target not found" });
    }

    const attachments = await prisma.mediaAttachment.findMany({
      where: { entity_type: entityType, entity_id: entityId, role: "GALLERY" },
      select: { attachment_id: true },
    });
    const known = new Set(attachments.map(({ attachment_id: id }) => id));
    if (normalizedIds.length !== known.size || normalizedIds.some((id) => !known.has(id))) {
      return res.status(400).json({ success: false, message: "The ordered list must contain every attachment in this gallery" });
    }

    await prisma.$transaction(
      normalizedIds.map((id, index) => prisma.mediaAttachment.update({
        where: { attachment_id: id },
        data: { display_order: index },
      })),
    );
    return res.json({ success: true, message: "Media order updated" });
  } catch (error) {
    return next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const mediaId = parseId(req.params.media_id);
    if (!mediaId) return res.status(400).json({ success: false, message: "Invalid media ID" });
    const media = await prisma.media.findUnique({ where: { media_id: mediaId }, include: { _count: { select: { attachments: true, home_gallery_items: true } } } });
    if (!media) return res.status(404).json({ success: false, message: "Media not found" });
    const [playerReferences, teamReferences, newsReferences] = await Promise.all([
      prisma.player.count({ where: { profile_photo: media.secure_url } }),
      prisma.team.count({ where: { logo: media.secure_url } }),
      prisma.news.count({ where: { featured_image: media.secure_url } }),
    ]);
    if (media._count.attachments || media._count.home_gallery_items || playerReferences || teamReferences || newsReferences) {
      return res.status(409).json({ success: false, message: "Detach this media from every entity and gallery before deletion" });
    }

    await prisma.media.update({ where: { media_id: mediaId }, data: { status: "DELETING" } });
    const result = await cloudinary.uploader.destroy(media.cloudinary_public_id, { resource_type: media.resource_type, invalidate: true });
    if (!["ok", "not found"].includes(result.result)) {
      await prisma.media.update({ where: { media_id: mediaId }, data: { status: "ACTIVE" } });
      return res.status(502).json({ success: false, message: "Cloudinary could not delete this asset. Please retry." });
    }
    await prisma.media.delete({ where: { media_id: mediaId } });
    await createAuditLog({ actor_user_id: req.user.user_id, action: "MEDIA_DELETED", entity_type: "MEDIA", entity_id: mediaId });
    return res.json({ success: true, message: "Media deleted" });
  } catch (error) { next(error); }
};

export const getPublicHomeGallery = async (req, res, next) => {
  try {
    const data = await prisma.homeGalleryItem.findMany({
      where: { is_published: true, media: { status: "ACTIVE", resource_type: "image" } },
      orderBy: [{ display_order: "asc" }, { gallery_item_id: "asc" }],
      select: { gallery_item_id: true, display_order: true, media: { select: { media_id: true, secure_url: true, alt_text: true, title: true, width: true, height: true } } },
    });
    res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getPublicEntityMedia = async (req, res, next) => {
  try {
    const entityType = String(req.params.entity_type || "").toUpperCase();
    const entityId = parseId(req.params.entity_id);
    if (!entityId || !ENTITY_TYPES.has(entityType)) {
      return res.status(400).json({ success: false, message: "Invalid media target" });
    }

    const data = await prisma.mediaAttachment.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        role: "GALLERY",
        is_published: true,
        media: { status: "ACTIVE" },
      },
      orderBy: [{ display_order: "asc" }, { created_at: "asc" }, { attachment_id: "asc" }],
      select: {
        attachment_id: true,
        display_order: true,
        role: true,
        created_at: true,
        media: {
          select: {
            media_id: true,
            secure_url: true,
            resource_type: true,
            mime_type: true,
            title: true,
            description: true,
            alt_text: true,
            width: true,
            height: true,
            duration: true,
          },
        },
      },
    });

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const listHomeGallery = async (req, res, next) => {
  try {
    const data = await prisma.homeGalleryItem.findMany({ orderBy: [{ display_order: "asc" }, { gallery_item_id: "asc" }], include: { media: { select: mediaSelect } } });
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const addHomeGalleryItem = async (req, res, next) => {
  try {
    const mediaId = parseId(req.body?.media_id);
    if (!mediaId) return res.status(400).json({ success: false, message: "A valid image media ID is required" });
    const media = await prisma.media.findUnique({ where: { media_id: mediaId } });
    if (!media || media.status !== "ACTIVE" || media.resource_type !== "image") return res.status(400).json({ success: false, message: "Select an active image from the media library" });
    const maximum = await prisma.homeGalleryItem.aggregate({ _max: { display_order: true } });
    const item = await prisma.homeGalleryItem.create({ data: { media_id: mediaId, display_order: Number.isInteger(req.body?.display_order) ? req.body.display_order : (maximum._max.display_order ?? -1) + 1, is_published: Boolean(req.body?.is_published) }, include: { media: { select: mediaSelect } } });
    return res.status(201).json({ success: true, data: item });
  } catch (error) { if (error.code === "P2002") return res.status(409).json({ success: false, message: "This image is already in the home gallery" }); next(error); }
};

export const updateHomeGalleryItem = async (req, res, next) => {
  try {
    const galleryItemId = parseId(req.params.gallery_item_id);
    if (!galleryItemId) return res.status(400).json({ success: false, message: "Invalid gallery item ID" });
    const data = {};
    if (Number.isInteger(req.body?.display_order) && req.body.display_order >= 0) data.display_order = req.body.display_order;
    if (typeof req.body?.is_published === "boolean") data.is_published = req.body.is_published;
    if (!Object.keys(data).length) return res.status(400).json({ success: false, message: "Provide a display order or publication status" });
    const item = await prisma.homeGalleryItem.update({ where: { gallery_item_id: galleryItemId }, data, include: { media: { select: mediaSelect } } });
    return res.json({ success: true, data: item });
  } catch (error) { if (error.code === "P2025") return res.status(404).json({ success: false, message: "Gallery item not found" }); next(error); }
};

export const removeHomeGalleryItem = async (req, res, next) => {
  try {
    const galleryItemId = parseId(req.params.gallery_item_id);
    if (!galleryItemId) return res.status(400).json({ success: false, message: "Invalid gallery item ID" });
    await prisma.homeGalleryItem.delete({ where: { gallery_item_id: galleryItemId } });
    return res.json({ success: true, message: "Image removed from the home gallery" });
  } catch (error) { if (error.code === "P2025") return res.status(404).json({ success: false, message: "Gallery item not found" }); next(error); }
};
