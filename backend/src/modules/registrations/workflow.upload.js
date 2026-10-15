import { randomUUID } from "node:crypto";
import cloudinary from "../../config/cloudinary.js";
import { requireRule } from "./workflow.validation.js";

export const maxUploadBytes = Math.min(5 * 1024 * 1024, Math.max(1024, Number(process.env.REGISTRATION_UPLOAD_MAX_BYTES) || 5 * 1024 * 1024));
export function inspectUpload(base64, receipt = true) {
  requireRule(typeof base64 === "string" && base64.length <= Math.ceil(maxUploadBytes / 3) * 4 && /^[A-Za-z0-9+/]*={0,2}$/.test(base64), "Choose a valid file within the upload limit.");
  const buffer = Buffer.from(base64, "base64");
  requireRule(buffer.length > 8 && buffer.length <= maxUploadBytes && buffer.toString("base64") === base64, "Choose a valid file within the upload limit.");
  let format;
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) format = "png";
  else if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) format = "jpg";
  else if (receipt && buffer.subarray(0, 5).toString() === "%PDF-" && buffer.subarray(-1024).toString().includes("%%EOF")) format = "pdf";
  requireRule(format, receipt ? "Receipt must contain a JPG, PNG or PDF file." : "Image must contain a JPG or PNG file.");
  return { buffer, format };
}
export async function uploadRegistrationFile(db, user, body, receipt = true, storage = cloudinary) {
  const { buffer, format } = inspectUpload(body.base64, receipt);
  const resource_type = format === "pdf" ? "raw" : "image";
  const public_id = `hpl/${receipt ? "private-receipts" : "registration-images"}/${randomUUID()}${format === "pdf" ? ".pdf" : ""}`;
  const result = await new Promise((resolve, reject) => {
    const stream = storage.uploader.upload_stream({ public_id, resource_type, type: receipt ? "authenticated" : "upload", overwrite: false }, (error, asset) => error ? reject(error) : resolve(asset));
    stream.end(buffer);
  });
  if (!receipt) return { url: result.secure_url };
  try {
    const row = await db.paymentReceipt.create({ data: { owner_id: user.user_id, public_id: result.public_id, resource_type, format, bytes: buffer.length, expires_at: new Date(Date.now() + 86400000) }, select: { receipt_id: true, format: true, bytes: true } });
    return row;
  } catch (error) {
    try { await storage.uploader.destroy(result.public_id, { resource_type, type: "authenticated" }); } catch { /* Orphan asset cleanup can be retried operationally. */ }
    throw error;
  }
}
export const receiptDownloadUrl = (receipt, storage = cloudinary) => storage.utils.private_download_url(receipt.public_id, receipt.resource_type === "raw" ? "" : receipt.format, { resource_type: receipt.resource_type, type: "authenticated", attachment: true, expires_at: Math.floor(Date.now() / 1000) + 300 });
