import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import NewsCard from "../components/NewsCard";
import NewsLeadStory from "../components/NewsLeadStory";
import NewsPagination from "../components/NewsPagination";
import NewsSearch from "../components/NewsSearch";
import { NewsListSkeleton } from "../components/NewsSkeleton";
import { getNews, getNewsCategories } from "../services/newsService";

const validPage = (value) => /^\d+$/.test(value || "") && Number(value) > 0 && Number(value) <= 10000 ? Number(value) : 1;

const NewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = validPage(searchParams.get("page"));
  const requestedQuery = (searchParams.get("q") || "").slice(0, 100);
  const query = requestedQuery.length === 1 ? "" : requestedQuery;
  const category = (searchParams.get("category") || "").slice(0, 50);
  const [state, setState] = useState({ articles: [], pagination: {}, status: "loading" });
  const [categories, setCategories] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);

  const updateSearch = useCallback((nextQuery) => { if (nextQuery === query) return; const next = {}; if (nextQuery) next.q = nextQuery; if (category) next.category = category; setSearchParams(next); }, [category, query, setSearchParams]);
  useEffect(() => { const controller = new AbortController(); const load = async () => { setState((previous) => ({ ...previous, status: "loading" })); try { const data = await getNews({ page, q: query, category, signal: controller.signal }); setState({ ...data, status: "success" }); } catch (error) { if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") setState({ articles: [], pagination: {}, status: "error" }); } }; load(); return () => controller.abort(); }, [category, page, query, reloadToken]);
  useEffect(() => { const controller = new AbortController(); const load = async () => { try { setCategories(await getNewsCategories(controller.signal)); } catch (error) { if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") setCategories([]); } }; load(); return () => controller.abort(); }, []);

  const lead = state.articles[0];
  const remainingArticles = useMemo(() => state.articles.slice(1), [state.articles]);
  const changePage = (nextPage) => { const next = {}; if (query) next.q = query; if (category) next.category = category; if (nextPage > 1) next.page = String(nextPage); setSearchParams(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const updateCategory = (nextCategory) => { const next = {}; if (query) next.q = query; if (nextCategory) next.category = nextCategory; setSearchParams(next); };
  const retry = () => setReloadToken((value) => value + 1);

  return <main className="min-h-screen bg-[#011427] pb-20 pt-20 text-white"><section className="border-b border-white/10 bg-[radial-gradient(circle_at_80%_12%,rgba(255,85,61,.16),transparent_25%),linear-gradient(135deg,#07192a,#10283d_55%,#011427)]"><div className="mx-auto max-w-7xl px-5 py-11 sm:px-6 sm:py-14 lg:px-8"><p className="text-[11px] font-bold tracking-[0.22em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p><h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-[#ffad9f] sm:text-5xl">LATEST FROM HPL</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Official updates, match stories and football news from across the league.</p></div></section><section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row"><NewsSearch key={query} initialQuery={query} onSearch={updateSearch} /><label className="sm:min-w-48"><span className="sr-only">Filter news by category</span><select value={category} onChange={(event) => updateCategory(event.target.value)} className="h-11 w-full rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none transition focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>{state.status === "loading" && <div className="mt-8"><NewsListSkeleton /></div>}{state.status === "error" && <div role="alert" className="mt-8 rounded-xl border border-red-400/25 bg-red-400/10 p-6"><p className="text-sm text-red-100">Unable to load news right now.</p><button type="button" onClick={retry} className="mt-4 rounded-md border border-red-200/30 px-4 py-2 text-xs font-bold text-red-100 transition hover:bg-red-200/10 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">TRY AGAIN</button></div>}{state.status === "success" && state.articles.length === 0 && <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-8"><h2 className="text-lg font-extrabold">{query || category ? "NO MATCHING NEWS" : "NO NEWS PUBLISHED YET"}</h2><p className="mt-2 text-sm leading-6 text-white/55">{query || category ? "Try a different search or category." : "Official HPL updates will appear here."}</p></div>}{state.status === "success" && state.articles.length > 0 && <><div className="mt-8">{lead && <NewsLeadStory article={lead} />}</div>{remainingArticles.length > 0 && <section className="mt-12" aria-labelledby="latest-news-grid"><div><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">LATEST NEWS</p><h2 id="latest-news-grid" className="mt-2 text-2xl font-extrabold">From the league</h2></div><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{remainingArticles.map((article) => <NewsCard key={article.news_id} article={article} />)}</div></section>}<NewsPagination pagination={state.pagination} onPageChange={changePage} /></>}</section></main>;
};

export default NewsPage;
