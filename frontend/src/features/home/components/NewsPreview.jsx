import { Link } from "react-router-dom";

import PreviewState from "./PreviewState";
import NewsImage from "../../news/components/NewsImage";
import { formatPublishedDate, getNewsExcerpt } from "../utils/homeFormatters";

const NewsPreview = ({ section }) => {
  if (section.status !== "success" || section.data.length === 0) {
    return <PreviewState status={section.status} emptyMessage="No news has been published yet." errorMessage="Latest news is unavailable right now." />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {section.data.map((news) => (
        <article key={news.news_id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0B1D2F]">
          <NewsImage src={news.featured_image} alt={news.title} className="h-44 w-full" />
          <div className="p-5"><p className="text-[10px] font-bold tracking-[0.14em] text-[#EEC058]">{news.category} · {formatPublishedDate(news.published_at)}</p><h3 className="mt-3 text-lg font-bold leading-6 text-white"><Link to={`/news/${news.news_id}`} className="transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{news.title}</Link></h3>{news.content && <p className="mt-3 text-sm leading-6 text-white/55">{getNewsExcerpt(news.content)}</p>}<Link to={`/news/${news.news_id}`} className="mt-4 inline-flex text-xs font-extrabold tracking-[0.1em] text-[#ffad9f] transition hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">READ STORY →</Link></div>
        </article>
      ))}
    </div>
  );
};

export default NewsPreview;
