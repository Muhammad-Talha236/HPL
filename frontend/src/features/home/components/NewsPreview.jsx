import PreviewState from "./PreviewState";
import { formatPublishedDate, getNewsExcerpt } from "../utils/homeFormatters";

const NewsPreview = ({ section }) => {
  if (section.status !== "success" || section.data.length === 0) {
    return <PreviewState status={section.status} emptyMessage="No news has been published yet." errorMessage="Latest news is unavailable right now." />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {section.data.map((news) => (
        <article key={news.news_id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0B1D2F]">
          {news.featured_image ? <img src={news.featured_image} alt="" className="h-44 w-full object-cover" loading="lazy" /> : <div className="h-44 bg-[linear-gradient(135deg,#153650,#081827)]" />}
          <div className="p-5"><p className="text-[10px] font-bold tracking-[0.14em] text-[#EEC058]">{news.category} · {formatPublishedDate(news.published_at)}</p><h3 className="mt-3 text-lg font-bold leading-6 text-white">{news.title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{getNewsExcerpt(news.content)}</p></div>
        </article>
      ))}
    </div>
  );
};

export default NewsPreview;
