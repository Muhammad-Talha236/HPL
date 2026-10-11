import apiClient from "../../../services/apiClient";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const validateMediaFile = (file) => {
  if (!file) return "Select a file first.";
  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) return "Use a JPEG, PNG, WebP, AVIF, MP4, or WebM file.";
  if (file.size > (isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)) {
    return isImage ? "Images must be 10 MB or smaller." : "Videos must be 100 MB or smaller.";
  }
  return null;
};

export const uploadMedia = async ({ file, category, title, description, altText, signal }) => {
  const fileError = validateMediaFile(file);
  if (fileError) throw new Error(fileError);

  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const signatureResponse = await apiClient.post("/media/upload-signature", {
    category,
    resource_type: resourceType,
  }, { signal });
  const upload = signatureResponse.data.data;
  const formData = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => formData.append(key, String(value)));
  formData.append("file", file);

  const cloudinaryResponse = await fetch(upload.upload_url, { method: "POST", body: formData, signal });
  const cloudinaryBody = await cloudinaryResponse.json().catch(() => ({}));
  if (!cloudinaryResponse.ok) throw new Error(cloudinaryBody.error?.message || "Cloudinary upload failed. Please retry.");

  const registered = await apiClient.post("/media", {
    upload_intent_id: upload.upload_intent_id,
    public_id: cloudinaryBody.public_id,
    asset_id: cloudinaryBody.asset_id,
    version: cloudinaryBody.version,
    resource_type: cloudinaryBody.resource_type,
    title,
    description,
    alt_text: altText,
  }, { signal });
  return registered.data.data;
};

export const getMedia = async (params = {}) => (await apiClient.get("/media", { params })).data;
export const getOwnTeamLogoMedia = async (signal) => (await apiClient.get("/media/team-logo", { signal })).data;
export const uploadOwnTeamLogoMedia = async ({ file, altText, signal }) => {
  const fileError = validateMediaFile(file);
  if (fileError || !file.type.startsWith("image/")) throw new Error(fileError || "Team logos must be images.");
  const signatureResponse = await apiClient.post("/media/team-logo/upload-signature", {}, { signal });
  const upload = signatureResponse.data?.data;
  const formData = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => formData.append(key, String(value)));
  formData.append("file", file);
  const cloudinaryResponse = await fetch(upload.upload_url, { method: "POST", body: formData, signal });
  const cloudinaryBody = await cloudinaryResponse.json().catch(() => ({}));
  if (!cloudinaryResponse.ok) throw new Error(cloudinaryBody.error?.message || "Logo upload failed. Please retry.");
  const registered = await apiClient.post("/media/team-logo", { upload_intent_id: upload.upload_intent_id, public_id: cloudinaryBody.public_id, asset_id: cloudinaryBody.asset_id, version: cloudinaryBody.version, resource_type: cloudinaryBody.resource_type, alt_text: altText || "Team logo" }, { signal });
  return registered.data?.data;
};
export const updateMedia = async (mediaId, data) => (await apiClient.patch(`/media/${mediaId}`, data)).data;
export const deleteMedia = async (mediaId) => (await apiClient.delete(`/media/${mediaId}`)).data;
export const attachMedia = async (mediaId, data) => (await apiClient.post(`/media/${mediaId}/attachments`, data)).data;
export const detachMedia = async (mediaId, data) => (await apiClient.delete(`/media/${mediaId}/attachments`, { data })).data;
export const getHomeGallery = async () => (await apiClient.get("/media/gallery/home")).data;
export const getEntityMedia = async (entityType, entityId) => (await apiClient.get(`/media/entity/${entityType}/${entityId}`)).data;
export const getManagedEntityMedia = async (entityType, entityId) => (await apiClient.get(`/media/entity/${entityType}/${entityId}/manage`)).data;
export const updateMediaAttachment = async (attachmentId, data) => (await apiClient.patch(`/media/attachments/${attachmentId}`, data)).data;
export const reorderMediaAttachments = async (entityType, entityId, attachmentIds) => (await apiClient.put(`/media/entity/${entityType}/${entityId}/order`, { attachment_ids: attachmentIds })).data;
export const getAdminHomeGallery = async () => (await apiClient.get("/media/home-gallery")).data;
export const addHomeGalleryItem = async (data) => (await apiClient.post("/media/home-gallery", data)).data;
export const updateHomeGalleryItem = async (id, data) => (await apiClient.patch(`/media/home-gallery/${id}`, data)).data;
export const removeHomeGalleryItem = async (id) => (await apiClient.delete(`/media/home-gallery/${id}`)).data;
