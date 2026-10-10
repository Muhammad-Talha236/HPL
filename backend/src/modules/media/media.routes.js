import express from "express";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { mediaUploadRateLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import { ROLES } from "../../constants/roles.js";
import {
  addHomeGalleryItem, attachMedia, createSignature, deleteMedia, detachMedia, getMedia, getPublicHomeGallery,
  getPublicEntityMedia, listEntityMedia, reorderEntityMedia, updateAttachment, listHomeGallery, listMedia, registerMedia, removeHomeGalleryItem, updateHomeGalleryItem, updateMedia,
} from "./media.controller.js";

const router = express.Router();

// Public delivery only exposes specifically published home-gallery images.
router.get("/gallery/home", getPublicHomeGallery);
router.get("/entity/:entity_type/:entity_id", getPublicEntityMedia);

router.use(authenticate, authorize(ROLES.SUPER_ADMIN));
router.get("/entity/:entity_type/:entity_id/manage", listEntityMedia);
router.patch("/attachments/:attachment_id", updateAttachment);
router.put("/entity/:entity_type/:entity_id/order", reorderEntityMedia);
router.post("/upload-signature", mediaUploadRateLimiter, createSignature);
router.post("/", mediaUploadRateLimiter, registerMedia);
router.get("/", listMedia);
router.get("/home-gallery", listHomeGallery);
router.post("/home-gallery", addHomeGalleryItem);
router.patch("/home-gallery/:gallery_item_id", updateHomeGalleryItem);
router.delete("/home-gallery/:gallery_item_id", removeHomeGalleryItem);
router.get("/:media_id", getMedia);
router.patch("/:media_id", updateMedia);
router.post("/:media_id/attachments", attachMedia);
router.delete("/:media_id/attachments", detachMedia);
router.delete("/:media_id", deleteMedia);

export default router;
