import prisma from "../../database/prisma.js";

const STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"];
const safeAuthor = { user_id: true, name: true, profile_image: true };
const positive = (value) => { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; };

const listSelect = {
  news_id: true, title: true, featured_image: true, category: true, status: true,
  published_at: true, created_at: true, updated_at: true,
  author: { select: safeAuthor },
};

export const getAdminNews = async (req, res, next) => {
  try {
    const { page = "1", limit = "20", q, status, category, author_id } = req.query;
    const pageNumber = positive(page); const limitNumber = positive(limit);
    if (!pageNumber || !limitNumber || limitNumber > 50) return res.status(400).json({ success: false, message: "page must be positive and limit must be between 1 and 50" });
    if (status && !STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid news status" });
    if (q !== undefined && typeof q !== "string") return res.status(400).json({ success: false, message: "Search must be a string" });
    if (category !== undefined && typeof category !== "string") return res.status(400).json({ success: false, message: "Category must be a string" });
    if (typeof q === "string" && q.trim().length > 100) return res.status(400).json({ success: false, message: "Search must not exceed 100 characters" });
    if (typeof category === "string" && category.trim().length > 50) return res.status(400).json({ success: false, message: "Category must not exceed 50 characters" });
    const where = { ...(q?.trim() ? { title: { contains: q.trim(), mode: "insensitive" } } : {}), ...(status ? { status } : {}), ...(category?.trim() ? { category: category.trim() } : {}) };
    if (author_id !== undefined) { const authorId = positive(author_id); if (!authorId) return res.status(400).json({ success: false, message: "author_id must be a positive integer" }); where.author_id = authorId; }
    const [data, total, grouped] = await Promise.all([
      prisma.news.findMany({ where, select: listSelect, orderBy: [{ created_at: "desc" }, { news_id: "desc" }], skip: (pageNumber - 1) * limitNumber, take: limitNumber }),
      prisma.news.count({ where }),
      prisma.news.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);
    const summary = Object.fromEntries(STATUSES.map((item) => [item, 0])); grouped.forEach((item) => { summary[item.status] = item._count._all; });
    return res.json({ success: true, data, summary, pagination: { page: pageNumber, limit: limitNumber, total, total_pages: Math.max(1, Math.ceil(total / limitNumber)) } });
  } catch (error) { next(error); }
};

export const getAdminNewsById = async (req, res, next) => {
  try {
    const newsId = positive(req.params.news_id);
    if (!newsId) return res.status(400).json({ success: false, message: "News ID must be a positive integer" });
    const news = await prisma.news.findUnique({ where: { news_id: newsId }, select: { ...listSelect, content: true } });
    if (!news) return res.status(404).json({ success: false, message: "News not found" });
    return res.json({ success: true, data: news });
  } catch (error) { next(error); }
};

export const getAdminNewsCategories = async (req, res, next) => {
  try {
    const rows = await prisma.news.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" }, take: 50 });
    return res.json({ success: true, data: rows.map((row) => row.category) });
  } catch (error) { next(error); }
};
