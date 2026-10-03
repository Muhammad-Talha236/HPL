import { Link } from "react-router-dom";

import NewsImage from "./NewsImage";
import { formatNewsDate, getNewsExcerpt } from "../utils/newsFormatters";

const NewsCard = ({ article }) => <article className="group overflow-hidden rounded-xl border border-white/10 bg-[#0B1D2F] transition duration-200 hover:-translate-y-1 hover:border-[#FF553D]/55"><NewsImage src={article.featured_image} alt={article.title} className="aspect-[16/9] w-full" /><div className="flex min-h-56 flex-col p-5"><p className="text-[10px] font-extrabold tracking-[0.14em] text-[#EEC058]">{article.category}{article.published_at ? ` · ${formatNewsDate(article.published_at)}` : ""}</p><h2 className="mt-3 text-xl font-extrabold leading-7 text-white"><Link to={`/news/${article.news_id}`} className="transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{article.title}</Link></h2>{article.content && <p className="mt-3 text-sm leading-6 text-white/55">{getNewsExcerpt(article.content)}</p>}<Link to={`/news/${article.news_id}`} className="mt-auto pt-5 text-xs font-extrabold tracking-[0.1em] text-[#ffad9f] transition hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">READ MORE →</Link></div></article>;

export default NewsCard;
