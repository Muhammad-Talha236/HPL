import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

import NewsImage from "./NewsImage";
import { getNewsCategoryClass, getNewsCategoryLabel } from "../utils/newsCategories";
import { formatNewsDate } from "../utils/newsFormatters";

const NewsLeadStory = ({ article }) => (
  <article className="overflow-hidden rounded-lg border border-[#e0e8e6] bg-white shadow-[0_4px_16px_rgba(15,23,42,.035)] lg:grid lg:grid-cols-[minmax(0,1.72fr)_minmax(270px,.82fr)]">
    <Link to={`/news/${article.news_id}`} className="block focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#087d50]/35">
      <NewsImage
        src={article.featured_image}
        alt={article.title}
        className="aspect-[16/8] h-full w-full lg:min-h-[260px] lg:aspect-auto"
      />
    </Link>
    <div className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
      <span className={`w-fit rounded px-2 py-1 text-[8px] font-extrabold uppercase tracking-[.04em] text-white ${getNewsCategoryClass(article.category)}`}>
        {getNewsCategoryLabel(article.category)}
      </span>
      <h2 className="mt-3 text-[19px] font-extrabold leading-[1.05] tracking-[-.035em] text-[#13203b] sm:text-[22px]">
        <Link to={`/news/${article.news_id}`} className="transition hover:text-[#087d50] focus:outline-none focus:ring-2 focus:ring-[#087d50]/25">
          {article.title}
        </Link>
      </h2>
      {article.excerpt && <p className="mt-3 line-clamp-4 text-[10px] leading-[15px] text-[#607087]">{article.excerpt}</p>}
      <div className="mt-4 flex items-center gap-1.5 text-[9px] font-medium text-[#77869a]">
        <CalendarDays size={11} />
        {formatNewsDate(article.published_at)}
      </div>
      <Link
        to={`/news/${article.news_id}`}
        className="mt-4 inline-flex w-fit items-center rounded-md bg-[#087d50] px-3 py-2 text-[9px] font-extrabold text-white transition hover:bg-[#066541] focus:outline-none focus:ring-2 focus:ring-[#087d50]/30"
      >
        Read More <span className="ml-1.5">→</span>
      </Link>
    </div>
  </article>
);

export default NewsLeadStory;
