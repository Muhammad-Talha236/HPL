export const DEFAULT_NEWS_PAGE_SIZE = 12;
export const MAX_NEWS_PAGE_SIZE = 24;
export const MAX_NEWS_PAGE = 10000;

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

export const parsePublicNewsQuery = (query = {}) => {
  const pageValue = query.page ?? "1";
  const limitValue = query.limit ?? String(DEFAULT_NEWS_PAGE_SIZE);
  const search = typeof query.q === "string" ? query.q.trim() : "";
  const category = typeof query.category === "string" ? query.category.trim() : "";

  if (!isPositiveInteger(pageValue) || Number(pageValue) > MAX_NEWS_PAGE) return { error: `Page must be between 1 and ${MAX_NEWS_PAGE}` };
  if (!isPositiveInteger(limitValue) || Number(limitValue) > MAX_NEWS_PAGE_SIZE) return { error: `Limit must be between 1 and ${MAX_NEWS_PAGE_SIZE}` };
  if (search.length === 1 || search.length > 100) return { error: "Search must be between 2 and 100 characters" };
  if (category.length > 50) return { error: "Category must not exceed 50 characters" };

  return { page: Number(pageValue), limit: Number(limitValue), search, category };
};

export const buildPublicNewsWhere = (status, { search, category }) => ({
  status,
  published_at: { not: null },
  ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
  ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
});
