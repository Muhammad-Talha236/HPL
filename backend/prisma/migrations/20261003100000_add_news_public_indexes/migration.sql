-- Public news is read chronologically by publication state and may be filtered
-- by category. PostgreSQL trigram indexing keeps bounded headline search viable
-- without introducing a separate search service.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "News_public_feed_idx"
  ON "public"."News" ("status", "published_at" DESC, "news_id" DESC);

CREATE INDEX "News_public_category_feed_idx"
  ON "public"."News" ("status", "category", "published_at" DESC, "news_id" DESC);

CREATE INDEX "News_title_trgm_idx"
  ON "public"."News" USING GIN ("title" gin_trgm_ops);
