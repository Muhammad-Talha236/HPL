import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import NewsImage from "../components/NewsImage";
import { ArticleSkeleton } from "../components/NewsSkeleton";
import { getNewsById } from "../services/newsService";
import { getNewsCategoryClass, getNewsCategoryLabel } from "../utils/newsCategories";
import {
  formatNewsDate,
  getArticleParagraphs,
  setArticleMetadata,
} from "../utils/newsFormatters";

const NewsDetailsPage = () => {
  const { newsId } = useParams();
  const isInvalidId = !/^\d+$/.test(newsId || "");
  const [state, setState] = useState({
    article: null,
    status: isInvalidId ? "not-found" : "loading",
  });

  useEffect(() => {
    if (isInvalidId) return undefined;

    const controller = new AbortController();
    getNewsById(newsId, controller.signal)
      .then((article) => setState({ article, status: "success" }))
      .catch((error) => {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setState({
            article: null,
            status: error.response?.status === 404 ? "not-found" : "error",
          });
        }
      });

    return () => controller.abort();
  }, [isInvalidId, newsId]);

  useEffect(() => (state.article ? setArticleMetadata(state.article) : undefined), [state.article]);

  if (state.status === "loading") {
    return <main className="min-h-screen bg-[#f6f9f8] px-5 pb-12 pt-[76px] sm:px-7"><ArticleSkeleton /></main>;
  }

  if (isInvalidId || state.status === "not-found" || state.status === "error") {
    const missing = isInvalidId || state.status === "not-found";

    return (
      <main className="min-h-screen bg-[#f6f9f8] px-5 pb-12 pt-[100px] sm:px-7">
        <section className="mx-auto max-w-2xl rounded-lg border border-[#e0e8e6] bg-white p-6 text-center">
          <p className="text-[10px] font-bold text-[#087d50]">HPL NEWS</p>
          <h1 className="mt-2 text-[22px] font-extrabold text-[#182741]">
            {missing ? "Article not found" : "Unable to load article"}
          </h1>
          <p className="mt-2 text-[11px] leading-5 text-[#68778b]">
            {missing ? "The article may have been removed or is no longer publicly available." : "Please try again shortly."}
          </p>
          <Link to="/news" className="mt-5 inline-flex rounded-md bg-[#087d50] px-3 py-2 text-[10px] font-extrabold text-white transition hover:bg-[#066541]">Back to News</Link>
        </section>
      </main>
    );
  }

  const { article } = state;

  return (
    <main className="min-h-screen bg-[#f6f9f8] pb-12 pt-[76px] text-[#13223a]">
      <article className="mx-auto max-w-[920px] px-5 pt-3 sm:px-7">
        <nav aria-label="Breadcrumb" className="text-[10px] font-semibold text-[#526275]">
          <Link to="/" className="transition hover:text-[#087d50]">Home</Link>
          <span className="mx-1.5 text-[#a2adba]">›</span>
          <Link to="/news" className="transition hover:text-[#087d50]">News</Link>
          <span className="mx-1.5 text-[#a2adba]">›</span>
          <span className="truncate">Article</span>
        </nav>

        <header className="mt-4">
          <span className={`inline-flex rounded px-2 py-1 text-[8px] font-extrabold uppercase tracking-[.04em] text-white ${getNewsCategoryClass(article.category)}`}>
            {getNewsCategoryLabel(article.category)}
          </span>
          <h1 className="mt-3 text-[28px] font-extrabold leading-[1.06] tracking-[-.04em] text-[#13203b] sm:text-[36px]">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-[#68778b]">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> {formatNewsDate(article.published_at)}</span>
            {article.author?.name && <span>By {article.author.name}</span>}
          </div>
        </header>

        <NewsImage src={article.featured_image} alt={article.title} className="mt-5 aspect-[16/9] w-full rounded-lg border border-[#e0e8e6]" />

        <div className="mx-auto max-w-[760px] py-8 text-[15px] leading-8 text-[#475a70]">
          {getArticleParagraphs(article.content).map((paragraph, index) => <p key={index} className="mb-5 whitespace-pre-line">{paragraph}</p>)}
        </div>

        <div className="border-t border-[#e0e8e6] pb-8 pt-4">
          <Link to="/news" className="text-[10px] font-extrabold text-[#087d50] transition hover:text-[#055f3d]">← Back to all news</Link>
        </div>
      </article>
    </main>
  );
};

export default NewsDetailsPage;
