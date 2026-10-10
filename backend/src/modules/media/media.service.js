import { randomUUID } from "node:crypto";
import cloudinary from "../../config/cloudinary.js";
import prisma from "../../database/prisma.js";
import {
  DIRECT_MEDIA_ROLES,
  ENTITY_TYPES,
  IMAGE_FORMATS,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  MEDIA_CATEGORIES,
  RESOURCE_TYPES,
  VIDEO_FORMATS,
} from "./media.constants.js";

const UPLOAD_INTENT_TTL_MS = 10 * 60 * 1000;

const cleanText = (value, maxLength) => {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLength) : null;
};

const mimeFor = (resourceType, format) => `${resourceType}/${format === "jpg" ? "jpeg" : format}`;

export const getUploadSpec = (category, resourceType) => {
  const categorySpec = MEDIA_CATEGORIES[category];
  if (!categorySpec || !RESOURCE_TYPES.has(resourceType) || !categorySpec.resourceTypes.includes(resourceType)) {
    return null;
  }

  return {
    folder: categorySpec.folder,
    allowedFormats: [...(resourceType === "image" ? IMAGE_FORMATS : VIDEO_FORMATS)],
  };
};

export const createUploadIntent = async ({ userId, category, resourceType }) => {
  const spec = getUploadSpec(category, resourceType);
  if (!spec) return null;

  const uploadIntentId = randomUUID();
  // Cloudinary prepends `folder` to a public_id. Keep the signed public_id
  // as the asset name so Dynamic Folder mode cannot duplicate the folder.
  const publicId = `${userId}-${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const tags = `hpl-managed,hpl-owner-${userId}`;
  const signature = cloudinary.utils.api_sign_request(
    {
      allowed_formats: spec.allowedFormats.join(","),
      folder: spec.folder,
      public_id: publicId,
      tags,
      timestamp,
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  await prisma.mediaUploadIntent.create({
    data: {
      upload_intent_id: uploadIntentId,
      public_id: publicId,
      resource_type: resourceType,
      category,
      folder: spec.folder,
      expires_at: new Date(Date.now() + UPLOAD_INTENT_TTL_MS),
      user_id: userId,
    },
  });

  return {
    upload_intent_id: uploadIntentId,
    upload_url: `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/${resourceType}/upload`,
    fields: {
      api_key: cloudinary.config().api_key,
      timestamp,
      signature,
      folder: spec.folder,
      public_id: publicId,
      tags,
      allowed_formats: spec.allowedFormats.join(","),
    },
  };
};

// Fixed-folder accounts return `folder/public_id`; Dynamic Folder Mode returns
// the signed public_id while exposing the destination as `asset_folder`.
// Both values are deterministic consequences of our signed request, so this
// does not broaden the set of assets an intent can register.
export const getAuthorizedPublicIds = (intent) => new Set([
  intent.public_id,
  `${intent.folder}/${intent.public_id}`,
]);

export const verifyCloudinaryAsset = async ({ intent, publicId, assetId, version, reportedResourceType }) => {
  const authorizedPublicIds = getAuthorizedPublicIds(intent);
  if (!publicId || !authorizedPublicIds.has(publicId)) {
    console.warn("Cloudinary media authorization mismatch", {
      intent_id: String(intent.upload_intent_id).slice(0, 8),
      expected_leaf_public_id: intent.public_id,
      expected_folder: intent.folder,
      received_public_id: publicId ? String(publicId).slice(0, 160) : "",
      resource_type: intent.resource_type,
    });
    throw new Error("The uploaded asset does not match this upload authorization");
  }

  let asset;
  try {
    asset = await cloudinary.api.resource(publicId, {
      resource_type: intent.resource_type,
      image_metadata: false,
      tags: true,
    });
  } catch {
    throw new Error("Cloudinary could not verify the uploaded asset");
  }

  const format = String(asset.format || "").toLowerCase();
  const allowedFormats = intent.resource_type === "image" ? IMAGE_FORMATS : VIDEO_FORMATS;
  const byteLimit = intent.resource_type === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  const expectedTags = new Set(["hpl-managed", `hpl-owner-${intent.user_id}`]);
  const assetTags = new Set(Array.isArray(asset.tags) ? asset.tags : []);
  const hasExpectedTags = [...expectedTags].every((tag) => assetTags.has(tag));
  const matchesUploadResult = (
    asset.asset_id === assetId
    && String(asset.version) === String(version)
    && reportedResourceType === intent.resource_type
  );

  if (
    asset.resource_type !== intent.resource_type
    || asset.public_id !== publicId
    || (asset.asset_folder && asset.asset_folder !== intent.folder)
    || !hasExpectedTags
    || !matchesUploadResult
    || !allowedFormats.has(format)
  ) {
    console.warn("Cloudinary media verification mismatch", {
      intent_id: String(intent.upload_intent_id).slice(0, 8),
      expected_folder: intent.folder,
      verified_public_id: asset.public_id,
      asset_folder: asset.asset_folder || "",
      resource_type: asset.resource_type,
      expected_resource_type: intent.resource_type,
      asset_id_matches: asset.asset_id === assetId,
      version_matches: String(asset.version) === String(version),
      expected_tags_present: hasExpectedTags,
    });
    throw new Error("The uploaded asset could not be verified");
  }
  if (!Number.isFinite(asset.bytes) || asset.bytes < 1 || asset.bytes > byteLimit) {
    throw new Error(`The uploaded ${intent.resource_type} exceeds the allowed size`);
  }
  if (intent.resource_type === "image" && (!asset.width || !asset.height || asset.width < 32 || asset.height < 32)) {
    throw new Error("Images must be at least 32 × 32 pixels");
  }
  if (intent.resource_type === "video" && asset.duration && asset.duration > MAX_VIDEO_DURATION_SECONDS) {
    throw new Error("Videos must be 15 minutes or shorter");
  }

  return { asset, format };
};

export const toMediaRecord = ({ asset, format, intent, metadata, userId }) => ({
  cloudinary_public_id: asset.public_id,
  secure_url: asset.secure_url,
  resource_type: intent.resource_type,
  mime_type: mimeFor(intent.resource_type, format),
  original_filename: cleanText(asset.original_filename, 255) || asset.public_id.split("/").at(-1),
  bytes: asset.bytes,
  width: asset.width || null,
  height: asset.height || null,
  duration: asset.duration || null,
  folder: asset.asset_folder || intent.folder,
  title: cleanText(metadata.title, 160),
  description: cleanText(metadata.description, 2000),
  alt_text: cleanText(metadata.alt_text, 240),
  uploaded_by_user_id: userId,
});

const entityDelegates = {
  PLAYER: "player",
  TEAM: "team",
  NEWS: "news",
  MATCH: "match",
  SEASON: "season",
  COMPETITION: "competition",
};

export const assertEntityExists = async (entityType, entityId) => {
  if (!ENTITY_TYPES.has(entityType) || !Number.isInteger(entityId) || entityId < 1) return false;
  const delegate = entityDelegates[entityType];
  const key = `${entityType.toLowerCase()}_id`;
  return Boolean(await prisma[delegate].findUnique({ where: { [key]: entityId }, select: { [key]: true } }));
};

export const attachDirectMediaUrl = async (transaction, { entityType, entityId, role, secureUrl }) => {
  if (DIRECT_MEDIA_ROLES[entityType] !== role) return;
  if (entityType === "PLAYER") await transaction.player.update({ where: { player_id: entityId }, data: { profile_photo: secureUrl } });
  if (entityType === "TEAM") await transaction.team.update({ where: { team_id: entityId }, data: { logo: secureUrl } });
  if (entityType === "NEWS") await transaction.news.update({ where: { news_id: entityId }, data: { featured_image: secureUrl } });
  if (entityType === "USER") await transaction.user.update({ where: { user_id: entityId }, data: { profile_image: secureUrl } });
};

export const clearDirectMediaUrl = async (transaction, { entityType, entityId, role, secureUrl }) => {
  if (DIRECT_MEDIA_ROLES[entityType] !== role) return;
  if (entityType === "PLAYER") await transaction.player.updateMany({ where: { player_id: entityId, profile_photo: secureUrl }, data: { profile_photo: null } });
  if (entityType === "TEAM") await transaction.team.updateMany({ where: { team_id: entityId, logo: secureUrl }, data: { logo: null } });
  if (entityType === "NEWS") await transaction.news.updateMany({ where: { news_id: entityId, featured_image: secureUrl }, data: { featured_image: null } });
  if (entityType === "USER") await transaction.user.updateMany({ where: { user_id: entityId, profile_image: secureUrl }, data: { profile_image: null } });
};
