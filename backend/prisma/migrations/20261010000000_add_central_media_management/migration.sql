CREATE TABLE "public"."Media" (
  "media_id" SERIAL NOT NULL,
  "cloudinary_public_id" TEXT NOT NULL,
  "secure_url" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "original_filename" TEXT NOT NULL,
  "bytes" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "duration" DOUBLE PRECISION,
  "folder" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "alt_text" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "uploaded_by_user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Media_pkey" PRIMARY KEY ("media_id")
);

CREATE TABLE "public"."MediaUploadIntent" (
  "upload_intent_id" TEXT NOT NULL,
  "public_id" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "folder" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaUploadIntent_pkey" PRIMARY KEY ("upload_intent_id")
);

CREATE TABLE "public"."MediaAttachment" (
  "attachment_id" SERIAL NOT NULL,
  "media_id" INTEGER NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" INTEGER NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'GALLERY',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAttachment_pkey" PRIMARY KEY ("attachment_id")
);

CREATE TABLE "public"."HomeGalleryItem" (
  "gallery_item_id" SERIAL NOT NULL,
  "media_id" INTEGER NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomeGalleryItem_pkey" PRIMARY KEY ("gallery_item_id")
);

CREATE UNIQUE INDEX "Media_cloudinary_public_id_key" ON "public"."Media"("cloudinary_public_id");
CREATE UNIQUE INDEX "MediaUploadIntent_public_id_key" ON "public"."MediaUploadIntent"("public_id");
CREATE UNIQUE INDEX "MediaAttachment_media_id_entity_type_entity_id_role_key" ON "public"."MediaAttachment"("media_id", "entity_type", "entity_id", "role");
CREATE UNIQUE INDEX "HomeGalleryItem_media_id_key" ON "public"."HomeGalleryItem"("media_id");
CREATE INDEX "Media_resource_type_status_created_at_idx" ON "public"."Media"("resource_type", "status", "created_at");
CREATE INDEX "Media_uploaded_by_user_id_created_at_idx" ON "public"."Media"("uploaded_by_user_id", "created_at");
CREATE INDEX "MediaUploadIntent_user_id_expires_at_idx" ON "public"."MediaUploadIntent"("user_id", "expires_at");
CREATE INDEX "MediaAttachment_entity_type_entity_id_idx" ON "public"."MediaAttachment"("entity_type", "entity_id");
CREATE INDEX "HomeGalleryItem_is_published_display_order_idx" ON "public"."HomeGalleryItem"("is_published", "display_order");

ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."MediaUploadIntent" ADD CONSTRAINT "MediaUploadIntent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."MediaAttachment" ADD CONSTRAINT "MediaAttachment_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."Media"("media_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."HomeGalleryItem" ADD CONSTRAINT "HomeGalleryItem_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."Media"("media_id") ON DELETE RESTRICT ON UPDATE CASCADE;
