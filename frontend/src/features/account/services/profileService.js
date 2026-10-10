import apiClient from "../../../services/apiClient";
import { validateMediaFile } from "../../media/services/mediaService";

export const getMyProfile = async () => (await apiClient.get("/users/me")).data;
export const updateMyProfile = async (data) => (await apiClient.patch("/users/me", data)).data;
export const getMyCompetitions = async () => (await apiClient.get("/users/me/competitions")).data;
export const getMyMatches = async () => (await apiClient.get("/users/me/matches")).data;

export const uploadProfilePhoto = async (file, signal) => {
  const fileError = validateMediaFile(file);
  if (fileError || !file.type.startsWith("image/")) throw new Error(fileError || "Profile photos must be images.");
  const signatureResponse = await apiClient.post("/media/profile/upload-signature", {}, { signal });
  const upload = signatureResponse.data?.data;
  const formData = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => formData.append(key, String(value)));
  formData.append("file", file);
  const cloudinaryResponse = await fetch(upload.upload_url, { method: "POST", body: formData, signal });
  const cloudinaryBody = await cloudinaryResponse.json().catch(() => ({}));
  if (!cloudinaryResponse.ok) throw new Error(cloudinaryBody.error?.message || "Cloudinary upload failed. Please retry.");
  const registered = await apiClient.post("/media/profile", {
    upload_intent_id: upload.upload_intent_id,
    public_id: cloudinaryBody.public_id,
    asset_id: cloudinaryBody.asset_id,
    version: cloudinaryBody.version,
    resource_type: cloudinaryBody.resource_type,
    alt_text: "Profile photo",
  }, { signal });
  return registered.data?.data;
};
