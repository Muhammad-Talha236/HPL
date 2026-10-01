import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

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
    const news = await prisma.news.findMany({
      where: {
        status: NEWS_STATUS.PUBLISHED,
      },
      select: newsSelect,
      orderBy: [
        {
          published_at: "desc",
        },
        {
          created_at: "desc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: news.length,
      data: news,
    });
  } catch (error) {
    console.error("Get news error:", error);
    next(error);
  }
};

/*
  GET NEWS BY ID

  Public users can only access published news.

  SUPER_ADMIN can access any article.

  Author can access their own article.
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

    const news = await prisma.news.findUnique({
      where: {
        news_id: newsId,
      },
      select: newsSelect,
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    /*
      Public access is allowed only for
      published news.

      If the route is authenticated,
      the author/SUPER_ADMIN can also
      access their unpublished article.
    */
    const isPrivilegedViewer =
      req.user &&
      canManageNews(
        req.user,
        news.author_id
      );

    if (
      news.status !== NEWS_STATUS.PUBLISHED &&
      !isPrivilegedViewer
    ) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

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