import apiClient from "../../../services/apiClient";

export const getNews = async ({ page = 1, q = "", category = "", signal } = {}) => {
  const response = await apiClient.get("/news", { params: { page, limit: 12, ...(q ? { q } : {}), ...(category ? { category } : {}) }, signal });
  return { articles: response.data?.data || [], pagination: response.data?.pagination || {} };
};

export const getNewsById = async (newsId, signal) => {
  const response = await apiClient.get(`/news/${newsId}`, { signal });
  return response.data?.data || null;
};

export const getNewsCategories = async (signal) => {
  const response = await apiClient.get("/news/categories", { signal });
  return response.data?.data || [];
};
