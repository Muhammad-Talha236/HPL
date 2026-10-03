import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { buildPublicNewsWhere, parsePublicNewsQuery } from "./news.query.js";

/*
  News statuses
*/
export const NEWS_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  UNPUBLISHED: "UNPUBLISHED",
};

/*
  Safe News SELECT

  Only required author information is exposed.
  Password hash and other sensitive User fields
  are never returned.
*/
const newsSelect = {
  news_id: true,
  author_id: true,
  title: true,
  content: true,
  featured_image: true,
  category: true,
  status: true,
  published_at: true,
  created_at: true,
  updated_at: true,

  author: {
    select: {
      user_id: true,
      name: true,
      profile_image: true,
    },
  },
};

// List responses intentionally exclude article content. A headline card must
// not transfer every full article in a large archive.
const publicNewsListSelect = {
  news_id: true,
  title: true,
  featured_image: true,
  category: true,
  published_at: true,
};

const publicNewsDetailSelect = {
  news_id: true,
  title: true,
  content: true,
  featured_image: true,
  category: true,
  published_at: true,
  updated_at: true,
  author: {
    select: {
      name: true,
      profile_image: true,
    },
  },
};

/*
  Check whether a user can manage a particular
  news article.

  SUPER_ADMIN:
    Can manage any article.

  Author:
    Can manage their own article.
*/
const canManageNews = (
  currentUser,
  authorId
) => {
  if (currentUser.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  return currentUser.user_id === authorId;
};

/*
  CREATE NEWS

  author_id is NEVER accepted from req.body.

  It is taken from the authenticated user.
*/
export const createNews = async (
  req,
  res,
  next
) => {
  try {
    const {
      title,
      content,
      featured_image,
      category,
    } = req.body;

    const news = await prisma.news.create({
      data: {
        author_id: req.user.user_id,
        title,
        content,
        featured_image:
          featured_image ?? null,
        category,
        status: NEWS_STATUS.DRAFT,
        published_at: null,
      },
      select: newsSelect,
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.NEWS_CREATED,
      entity_type: "NEWS",
      entity_id: news.news_id,
      details: {
        title: news.title,
        category: news.category,
      },
    });

    return res.status(201).json({
      success: true,
      message: "News created successfully",
      data: news,
    });
  } catch (error) {
    console.error("Create news error:", error);
    next(error);
  }
};

/*
  GET ALL NEWS

  Public endpoint.

  Only PUBLISHED news is returned publicly.
*/
export const getNews = async (
  req,
  res,
  next
) => {
  try {
    const query = parsePublicNewsQuery(req.query);
    if (query.error) return res.status(400).json({ success: false, message: query.error });

    const where = buildPublicNewsWhere(NEWS_STATUS.PUBLISHED, query);
    const [news, total] = await prisma.$transaction([
      prisma.news.findMany({
        where,
        select: publicNewsListSelect,
        orderBy: [{ published_at: "desc" }, { news_id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.news.count({ where }),
    ]);

    res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json({
      success: true,
      count: news.length,
      data: news,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
        has_next: query.page * query.limit < total,
        has_previous: query.page > 1,
      },
    });
  } catch (error) {
    console.error("Get news error:", error);
    next(error);
  }
};

/*
  GET PUBLIC NEWS CATEGORIES

  Categories are free-text in the current domain, so return only the small,
  published catalogue needed by the public filter. The query is bounded and
  uses the public category-feed index.
*/
export const getNewsCategories = async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT DISTINCT "category"
      FROM "public"."News"
      WHERE "status" = ${NEWS_STATUS.PUBLISHED}
        AND "published_at" IS NOT NULL
      ORDER BY "category" ASC
      LIMIT 50
    `;
    res.set("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=900");
    return res.status(200).json({ success: true, data: rows.map((row) => row.category) });
  } catch (error) {
    console.error("Get news categories error:", error);
    next(error);
  }
};

/*
  GET NEWS BY ID

  This is the public read path. It intentionally
  queries only published news with a publication date.
  Management endpoints use their own authorization flow.
*/
export const getNewsById = async (
  req,
  res,
  next
) => {
  try {
    const newsId = Number(
      req.params.news_id
    );

    const news = await prisma.news.findFirst({
      where: {
        news_id: newsId,
        status: NEWS_STATUS.PUBLISHED,
        published_at: { not: null },
      },
      select: publicNewsDetailSelect,
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(
      "Get news by ID error:",
      error
    );

    next(error);
  }
};

/*
  UPDATE NEWS

  Editable:
    - title
    - content
    - featured_image
    - category

  Not editable:
    - author_id
    - status
    - published_at
    - news_id
*/
export const updateNews = async (
  req,
  res,
  next
) => {
  try {
    const newsId = Number(
      req.params.news_id
    );

    const existingNews =
      await prisma.news.findUnique({
        where: {
          news_id: newsId,
        },
        select: {
          news_id: true,
          author_id: true,
          title: true,
          content: true,
          featured_image: true,
          category: true,
          status: true,
        },
      });

    if (!existingNews) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    if (
      !canManageNews(
        req.user,
        existingNews.author_id
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this news",
      });
    }

    const updateData = {};

    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }

    if (req.body.content !== undefined) {
      updateData.content = req.body.content;
    }

    if (
      req.body.featured_image !== undefined
    ) {
      updateData.featured_image =
        req.body.featured_image;
    }

    if (req.body.category !== undefined) {
      updateData.category =
        req.body.category;
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one news field is required",
      });
    }

    const updatedNews =
      await prisma.news.update({
        where: {
          news_id: newsId,
        },
        data: updateData,
        select: newsSelect,
      });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.NEWS_UPDATED,
      entity_type: "NEWS",
      entity_id: newsId,
      details: {
        updated_fields:
          Object.keys(updateData),
      },
    });

    return res.status(200).json({
      success: true,
      message: "News updated successfully",
      data: updatedNews,
    });
  } catch (error) {
    console.error("Update news error:", error);
    next(error);
  }
};

/*
  PUBLISH NEWS

  DRAFT / UNPUBLISHED -> PUBLISHED

  published_at is generated by the server.
*/
export const publishNews = async (
  req,
  res,
  next
) => {
  try {
    const newsId = Number(
      req.params.news_id
    );

    const existingNews =
      await prisma.news.findUnique({
        where: {
          news_id: newsId,
        },
        select: {
          news_id: true,
          author_id: true,
          status: true,
        },
      });

    if (!existingNews) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    if (
      !canManageNews(
        req.user,
        existingNews.author_id
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to publish this news",
      });
    }

    if (
      existingNews.status ===
      NEWS_STATUS.PUBLISHED
    ) {
      return res.status(400).json({
        success: false,
        message: "News is already published",
      });
    }

    const publishedAt = new Date();

    const result =
      await prisma.news.updateMany({
        where: {
          news_id: newsId,
          status: {
            in: [
              NEWS_STATUS.DRAFT,
              NEWS_STATUS.UNPUBLISHED,
            ],
          },
        },
        data: {
          status: NEWS_STATUS.PUBLISHED,
          published_at: publishedAt,
        },
      });

    if (result.count !== 1) {
      return res.status(409).json({
        success: false,
        message:
          "News status changed by another request. Please try again.",
      });
    }

    const news =
      await prisma.news.findUnique({
        where: {
          news_id: newsId,
        },
        select: newsSelect,
      });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.NEWS_PUBLISHED,
      entity_type: "NEWS",
      entity_id: newsId,
      details: {
        published_at: publishedAt,
      },
    });

    return res.status(200).json({
      success: true,
      message: "News published successfully",
      data: news,
    });
  } catch (error) {
    console.error(
      "Publish news error:",
      error
    );

    next(error);
  }
};

/*
  UNPUBLISH NEWS

  PUBLISHED -> UNPUBLISHED

  published_at is cleared.
*/
export const unpublishNews = async (
  req,
  res,
  next
) => {
  try {
    const newsId = Number(
      req.params.news_id
    );

    const existingNews =
      await prisma.news.findUnique({
        where: {
          news_id: newsId,
        },
        select: {
          news_id: true,
          author_id: true,
          status: true,
        },
      });

    if (!existingNews) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    if (
      !canManageNews(
        req.user,
        existingNews.author_id
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to unpublish this news",
      });
    }

    if (
      existingNews.status !==
      NEWS_STATUS.PUBLISHED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only published news can be unpublished",
      });
    }

    const result =
      await prisma.news.updateMany({
        where: {
          news_id: newsId,
          status: NEWS_STATUS.PUBLISHED,
        },
        data: {
          status: NEWS_STATUS.UNPUBLISHED,
          published_at: null,
        },
      });

    if (result.count !== 1) {
      return res.status(409).json({
        success: false,
        message:
          "News status changed by another request. Please try again.",
      });
    }

    const news =
      await prisma.news.findUnique({
        where: {
          news_id: newsId,
        },
        select: newsSelect,
      });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.NEWS_UNPUBLISHED,
      entity_type: "NEWS",
      entity_id: newsId,
      details: {
        unpublished_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "News unpublished successfully",
      data: news,
    });
  } catch (error) {
    console.error(
      "Unpublish news error:",
      error
    );

    next(error);
  }
};

/*
  DELETE NEWS

  Hard delete is intentionally restricted
  to SUPER_ADMIN.

  This prevents ordinary authors from
  permanently destroying league records.
*/
export const deleteNews = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message:
          "Only SUPER_ADMIN can delete news",
      });
    }

    const newsId = Number(
      req.params.news_id
    );

    const existingNews =
      await prisma.news.findUnique({
        where: {
          news_id: newsId,
        },
        select: {
          news_id: true,
          title: true,
          status: true,
        },
      });

    if (!existingNews) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    await prisma.news.delete({
      where: {
        news_id: newsId,
      },
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.NEWS_DELETED,
      entity_type: "NEWS",
      entity_id: newsId,
      details: {
        title: existingNews.title,
        previous_status:
          existingNews.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error) {
    console.error("Delete news error:", error);
    next(error);
  }
};
