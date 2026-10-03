export const formatNewsDate = (value) => value ? new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value)) : "";

export const getNewsExcerpt = (content, length = 150) => {
  const text = String(content || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
};

export const getArticleParagraphs = (content) => String(content || "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

export const setArticleMetadata = (article) => {
  if (!article) return () => {};
  const previousTitle = document.title;
  const previousDescription = document.querySelector('meta[name="description"]')?.content;
  document.title = `${article.title} | HPL News`;
  const description = getNewsExcerpt(article.content, 155);
  let descriptionNode = document.querySelector('meta[name="description"]');
  if (!descriptionNode) { descriptionNode = document.createElement("meta"); descriptionNode.name = "description"; document.head.appendChild(descriptionNode); }
  descriptionNode.content = description;
  return () => { document.title = previousTitle; if (previousDescription !== undefined) descriptionNode.content = previousDescription; };
};
