import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import NewsImage from "../components/NewsImage";
import { ArticleSkeleton } from "../components/NewsSkeleton";
import { getNewsById } from "../services/newsService";
import { formatNewsDate, getArticleParagraphs, setArticleMetadata } from "../utils/newsFormatters";

const NewsDetailsPage = () => {
  const { newsId } = useParams();
  const isInvalidId = !/^\d+$/.test(newsId || "");
  const [state, setState] = useState({ article: null, status: /^\d+$/.test(newsId || "") ? "loading" : "not-found" });
  useEffect(() => { if (isInvalidId) return undefined; const controller = new AbortController(); const load = async () => { setState({ article: null, status: "loading" }); try { const article = await getNewsById(newsId, controller.signal); setState({ article, status: "success" }); } catch (error) { if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") setState({ article: null, status: error.response?.status === 404 ? "not-found" : "error" }); } }; load(); return () => controller.abort(); }, [isInvalidId, newsId]);
  useEffect(() => state.article ? setArticleMetadata(state.article) : undefined, [state.article]);
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); } catch { /* Clipboard access is optional; article remains shareable through its URL. */ } };
  if (state.status === "loading") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-20 text-white sm:px-6"><ArticleSkeleton /></main>;
  if (isInvalidId || state.status === "not-found" || state.status === "error") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-36 text-white sm:px-6"><section className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] p-8"><p className="text-[10px] font-extrabold tracking-[0.16em] text-[#EEC058]">HPL NEWS</p><h1 className="mt-3 text-3xl font-extrabold">{isInvalidId || state.status === "not-found" ? "ARTICLE NOT FOUND" : "UNABLE TO LOAD ARTICLE"}</h1><p className="mt-3 text-sm leading-6 text-white/60">{isInvalidId || state.status === "not-found" ? "The article may have been removed or is no longer publicly available." : "Please try again shortly."}</p><Link to="/news" className="mt-6 inline-flex rounded-md border border-[#EEC058]/60 px-4 py-2 text-xs font-extrabold tracking-wide text-[#EEC058] transition hover:bg-[#EEC058] hover:text-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">BACK TO NEWS</Link></section></main>;
  const { article } = state;
  return <main className="min-h-screen bg-[#011427] pb-20 pt-20 text-white"><article><header className="border-b border-white/10 bg-[linear-gradient(135deg,#07192a,#10283d_55%,#011427)]"><div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14"><Link to="/news" className="text-xs font-extrabold tracking-[0.1em] text-[#EEC058] transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">← BACK TO NEWS</Link><p className="mt-7 text-[10px] font-extrabold tracking-[0.17em] text-[#EEC058]">{article.category}</p><h1 className="mt-3 text-4xl font-extrabold leading-tight text-[#ffad9f] sm:text-5xl">{article.title}</h1><div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/55"><span>Published {formatNewsDate(article.published_at)}</span>{article.author?.name && <span>By {article.author.name}</span>}<button type="button" onClick={share} className="font-bold text-white/70 transition hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">COPY LINK</button></div></div></header><div className="mx-auto max-w-4xl px-5 pt-8 sm:px-6"><NewsImage src={article.featured_image} alt={article.title} className="aspect-[16/9] w-full rounded-xl border border-white/10" /></div><div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6"><div className="space-y-6 text-[17px] leading-8 text-white/75">{getArticleParagraphs(article.content).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}</div>{article.updated_at && article.updated_at !== article.published_at && <p className="mt-10 border-t border-white/10 pt-5 text-xs text-white/40">Last updated {formatNewsDate(article.updated_at)}</p>}</div></article></main>;
};

export default NewsDetailsPage;
