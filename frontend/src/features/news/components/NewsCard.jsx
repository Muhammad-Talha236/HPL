import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

import NewsImage from "./NewsImage";
import { getNewsCategoryClass, getNewsCategoryLabel } from "../utils/newsCategories";
import { formatNewsDate } from "../utils/newsFormatters";

const NewsCard = ({ article }) => (
  <article className="group overflow-hidden rounded-lg border border-[#e0e8e6] bg-white shadow-[0_3px_12px_rgba(15,23,42,.025)] transition hover:-translate-y-0.5 hover:border-[#bcd6ca]">
    <Link to={`/news/${article.news_id}`} className="relative block focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#087d50]/35">
      <NewsImage src={article.featured_image} alt={article.title} className="aspect-[16/7.5] w-full" />
      <span className={`absolute bottom-2 left-2 rounded px-1.5 py-1 text-[7px] font-extrabold uppercase tracking-[.03em] text-white ${getNewsCategoryClass(article.category)}`}>
        {getNewsCategoryLabel(article.category)}
      </span>
    </Link>
    <div className="flex min-h-[170px] flex-col p-3">
      <p className="inline-flex items-center gap-1 text-[8px] font-medium text-[#7a899b]">
        <CalendarDays size={10} /> {formatNewsDate(article.published_at)}
      </p>
      <h2 className="mt-1.5 line-clamp-2 text-[11px] font-extrabold leading-[14px] text-[#172640]">
        <Link to={`/news/${article.news_id}`} className="transition hover:text-[#087d50] focus:outline-none focus:ring-2 focus:ring-[#087d50]/25">
          {article.title}
        </Link>
      </h2>
      {article.excerpt && <p className="mt-1.5 line-clamp-3 text-[9px] leading-[13px] text-[#65758a]">{article.excerpt}</p>}
      <Link
        to={`/news/${article.news_id}`}
        className="mt-auto pt-2 text-right text-[8px] font-extrabold text-[#087d50] transition hover:text-[#055f3d] focus:outline-none focus:ring-2 focus:ring-[#087d50]/25"
      >
        Read More <span aria-hidden="true">→</span>
      </Link>
    </div>
  </article>
);

export default NewsCard;
