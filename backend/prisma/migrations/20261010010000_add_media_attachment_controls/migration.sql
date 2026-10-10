ALTER TABLE "public"."MediaAttachment"
  ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT true;

WITH ordered AS (
  SELECT
    "attachment_id",
    ROW_NUMBER() OVER (
      PARTITION BY "entity_type", "entity_id", "role"
      ORDER BY "created_at" ASC, "attachment_id" ASC
    ) - 1 AS position
  FROM "public"."MediaAttachment"
)
UPDATE "public"."MediaAttachment" AS attachment
SET "display_order" = ordered.position
FROM ordered
WHERE attachment."attachment_id" = ordered."attachment_id";
