import { Link } from "react-router-dom";

import NewsImage from "./NewsImage";
import { formatNewsDate, getNewsExcerpt } from "../utils/newsFormatters";

const NewsLeadStory = ({ article }) => <article className="overflow-hidden rounded-xl border border-[#EEC058]/25 bg-[#0B1D2F] lg:grid lg:grid-cols-2"><NewsImage src={article.featured_image} alt={article.title} className="aspect-[16/9] h-full w-full lg:aspect-auto lg:min-h-80" /><div className="flex flex-col justify-center p-6 sm:p-8"><p className="text-[10px] font-extrabold tracking-[0.16em] text-[#EEC058]">LATEST STORY · {article.category}</p><h2 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl"><Link to={`/news/${article.news_id}`} className="transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{article.title}</Link></h2><p className="mt-4 text-sm leading-7 text-white/65">{getNewsExcerpt(article.content, 240) || "Read the latest official update from Hunza Premier League."}</p><div className="mt-6 flex items-center justify-between gap-4"><span className="text-xs text-white/45">{formatNewsDate(article.published_at)}</span><Link to={`/news/${article.news_id}`} className="text-xs font-extrabold tracking-[0.1em] text-[#ffad9f] transition hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">READ STORY →</Link></div></div></article>;

export default NewsLeadStory;
