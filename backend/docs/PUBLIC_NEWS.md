# Public News API

## Domain

`News` uses `news_id` as its public identifier. It has `title`, plain-text `content`, optional `featured_image` URL, free-text `category`, `status`, `published_at`, `created_at`, `updated_at`, and an `author` relation. There is no slug, excerpt field, or featured/pinned flag.

Publication states are `DRAFT`, `PUBLISHED`, and `UNPUBLISHED`. The publication action sets `published_at`; unpublishing clears it.

## Public endpoints

- `GET /api/news?page=1&limit=12&q=fixture&category=Match%20Report`
  - `page`: 1–10,000; default 1.
  - `limit`: 1–24; default 12.
  - `q`: optional 2–100 character, case-insensitive headline search.
  - `category`: optional case-insensitive exact category, up to 50 characters.
  - Results are ordered by `published_at DESC, news_id DESC` and return list-safe fields only: ID, title, image, category, and publication time. Pagination metadata is at `pagination`.
- `GET /api/news/:news_id`
  - Returns the published article body and the author display name/profile image only.
- `GET /api/news/categories`
  - Returns up to 50 alphabetically ordered categories currently used by published articles, for the public category selector.

Both endpoints query only records with `status = PUBLISHED` and a non-null `published_at`; unavailable records return `404` from the detail endpoint. Public GET responses declare short browser/CDN-friendly cache directives.

## Security and scaling

- Public list/detail queries cannot expose drafts or unpublished articles.
- Article content is stored and rendered as plain text. The public React application does not use `dangerouslySetInnerHTML`.
- The list endpoint is bounded and never returns full article bodies, so Home requests only `limit=3`.
- PostgreSQL indexes cover the public chronological feed and category feed. `pg_trgm` plus a GIN index supports case-insensitive headline search without a separate search service.
- The global API limiter remains 100 requests per 15 minutes per IP. There is no News-specific limiter, so public reads are governed consistently with the existing API policy.

## Current limitations

Images are URL strings; there is no media-storage/CDN subsystem in this repository. The Vite SPA updates the title and description after client rendering, but high-confidence social previews and crawler SEO at large scale would require SSR or prerendering in a future architecture.
