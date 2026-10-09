import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import NewsCard from "../components/NewsCard";
import NewsCategoryFilters from "../components/NewsCategoryFilters";
import NewsLeadStory from "../components/NewsLeadStory";
import NewsPagination from "../components/NewsPagination";
import { NewsListSkeleton } from "../components/NewsSkeleton";
import { getNews, getNewsCategories } from "../services/newsService";

const validPage = (value) => (
  /^\d+$/.test(value || "") && Number(value) > 0 && Number(value) <= 10000
    ? Number(value)
    : 1
);

const NewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = validPage(searchParams.get("page"));
  const category = (searchParams.get("category") || "").slice(0, 50);
  const [state, setState] = useState({ articles: [], pagination: {}, status: "loading" });
  const [categories, setCategories] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getNews({ page, limit: 7, category, signal: controller.signal })
      .then((data) => setState({ ...data, status: "success" }))
      .catch((error) => {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setState({ articles: [], pagination: {}, status: "error" });
        }
      });

    return () => controller.abort();
  }, [category, page, reloadToken]);

  useEffect(() => {
    const controller = new AbortController();

    getNewsCategories(controller.signal)
      .then(setCategories)
      .catch((error) => {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setCategories([]);
        }
      });

    return () => controller.abort();
  }, []);

  const lead = state.articles[0];
  const remainingArticles = useMemo(() => state.articles.slice(1), [state.articles]);

  const updateCategory = (nextCategory) => {
    setSearchParams(nextCategory ? { category: nextCategory } : {});
  };

  const changePage = (nextPage) => {
    const next = category ? { category } : {};
    if (nextPage > 1) next.page = String(nextPage);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retry = () => setReloadToken((value) => value + 1);

  return (
    <main className="min-h-screen bg-[#f6f9f8] pb-12 pt-[76px] text-[#13223a]">
      <section className="mx-auto max-w-[1200px] px-5 pb-8 pt-3 sm:px-7 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-[10px] font-semibold text-[#526275]">
          <Link to="/" className="transition hover:text-[#087d50]">Home</Link>
          <span className="mx-1.5 text-[#a2adba]">›</span>
          <span>News</span>
        </nav>

        <h1 className="mt-2 text-[22px] font-extrabold tracking-[-.035em] text-[#10203b] sm:text-[24px]">
          Latest News
        </h1>
        <p className="mt-0.5 text-[9px] font-medium text-[#6a798d] sm:text-[10px]">
          Stay updated with the latest news, announcements and stories from Hunza Premier League.
        </p>

        <div className="mt-3">
          <NewsCategoryFilters categories={categories} value={category} onChange={updateCategory} />
        </div>

        {state.status === "loading" && <div className="mt-3"><NewsListSkeleton /></div>}

        {state.status === "error" && (
          <section role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-[#9c2830]">
            <p className="text-[11px] font-medium">Unable to load news right now.</p>
            <button type="button" onClick={retry} className="mt-2 rounded border border-current/25 px-3 py-1.5 text-[9px] font-bold transition hover:bg-black/[.03]">Try again</button>
          </section>
        )}

        {state.status === "success" && !state.articles.length && (
          <section className="mt-3 rounded-lg border border-[#e0e8e6] bg-white p-5 text-center">
            <h2 className="text-[13px] font-extrabold text-[#21314a]">No news available</h2>
            <p className="mt-1 text-[10px] text-[#6d7b8e]">
              {category ? "There are no published articles in this category yet." : "Published league updates will appear here."}
            </p>
            {category && <button type="button" onClick={() => updateCategory("")} className="mt-3 text-[10px] font-extrabold text-[#087d50] hover:text-[#055f3d]">View all news</button>}
          </section>
        )}

        {state.status === "success" && state.articles.length > 0 && (
          <>
            <div className="mt-3"><NewsLeadStory article={lead} /></div>
            {remainingArticles.length > 0 && (
              <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Recent news">
                {remainingArticles.map((article) => <NewsCard key={article.news_id} article={article} />)}
              </section>
            )}
            <NewsPagination pagination={state.pagination} onPageChange={changePage} />
          </>
        )}
      </section>
    </main>
  );
};

export default NewsPage;
