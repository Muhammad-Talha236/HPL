import { useRef } from "react";
import { Link } from "react-router-dom";

import PreviewState from "./PreviewState";
import NewsImage from "../../news/components/NewsImage";
import {
  formatPublishedDate,
  getNewsExcerpt,
} from "../utils/homeFormatters";

const ArrowLeft = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-5 w-5"
  >
    <path
      d="m15 18-6-6 6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-5 w-5"
  >
    <path
      d="m9 18 6-6-6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-3.5 w-3.5"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.7"
    />

    <path
      d="M7 3v4M17 3v4M3 10h18"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const NewsCard = ({ news }) => {
  const excerpt = news.content
    ? getNewsExcerpt(news.content)
    : null;

  return (
    <article
      className="
        group
        min-w-[82%]
        snap-start
        overflow-hidden
        rounded-[14px]
        border border-[#E4E9E6]
        bg-white
        shadow-[0_8px_24px_rgba(15,23,42,0.04)]
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]
        sm:min-w-[330px]
        lg:min-w-[calc((100%-48px)/4)]
        xl:min-w-[calc((100%-48px)/4)]
      "
    >
      {/* Image */}
      <Link
        to={`/news/${news.news_id}`}
        className="
          relative block
          h-[185px]
          overflow-hidden
          focus:outline-none
          focus:ring-2
          focus:ring-inset
          focus:ring-[#087554]/30
        "
      >
        <NewsImage
          src={news.featured_image}
          alt={news.title}
          className="
            h-full w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-[1.035]
          "
        />

        {/* Category */}
        {news.category && (
          <span
            className="
              absolute left-4 top-4
              max-w-[150px]
              truncate
              rounded-full
              bg-[#E6F5EE]/95
              px-3 py-1.5
              text-[9px]
              font-extrabold
              uppercase
              tracking-[0.13em]
              text-[#087554]
              backdrop-blur-sm
            "
          >
            {news.category}
          </span>
        )}

        {/* Date */}
        {news.published_at && (
          <span
            className="
              absolute bottom-3 right-3
              inline-flex items-center
              gap-1.5
              rounded-md
              bg-[#101828]/80
              px-2.5 py-1.5
              text-[10px]
              font-semibold
              text-white
              backdrop-blur-sm
            "
          >
            <CalendarIcon />

            {formatPublishedDate(news.published_at)}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex min-h-[205px] flex-col p-4 sm:p-5">
        <h3
          className="
            line-clamp-2
            text-[15px]
            font-extrabold
            leading-[1.4]
            tracking-[-0.01em]
            text-[#101828]
          "
        >
          <Link
            to={`/news/${news.news_id}`}
            className="
              transition-colors
              hover:text-[#087554]
              focus:outline-none
              focus:ring-2
              focus:ring-[#087554]/20
            "
          >
            {news.title}
          </Link>
        </h3>

        {excerpt && (
          <p
            className="
              mt-2
              line-clamp-3
              text-xs
              leading-5
              text-[#737F79]
            "
          >
            {excerpt}
          </p>
        )}

        <div className="mt-auto pt-4">
          <Link
            to={`/news/${news.news_id}`}
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-bold
              text-[#087554]
              transition-all
              hover:gap-3
              hover:text-[#065E43]
              focus:outline-none
              focus:ring-2
              focus:ring-[#087554]/20
            "
          >
            Read More

            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

const NewsPreview = ({ section }) => {
  const sliderRef = useRef(null);

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;

    const amount = slider.clientWidth * 0.75;

    slider.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (
    section.status !== "success" ||
    section.data.length === 0
  ) {
    return (
      <PreviewState
        status={section.status}
        emptyMessage="No news has been published yet."
        errorMessage="Latest news is unavailable right now."
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div
        className="
          mb-6 flex flex-col
          gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-[3px] w-10 rounded-full bg-[#087554]" />

            <span
              className="
                text-[10px]
                font-extrabold
                uppercase
                tracking-[0.2em]
                text-[#34433D]
              "
            >
              Latest News
            </span>
          </div>

          <h2
            className="
              text-2xl
              font-extrabold
              tracking-[-0.03em]
              text-[#101828]
              sm:text-3xl
            "
          >
            Latest{" "}
            <span className="text-[#087554]">
              News
            </span>
          </h2>

          <p className="mt-1 text-sm text-[#7A8580]">
            Stay updated with the latest news, announcements and stories
            from Hunza Premier League.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/news"
            className="
              inline-flex
              items-center
              justify-center
              gap-3
              rounded-full
              border border-[#DFE5E2]
              bg-white
              px-5 py-2.5
              text-xs
              font-bold
              text-[#17211D]
              shadow-[0_3px_12px_rgba(15,23,42,0.04)]
              transition-all
              hover:border-[#BFD0C8]
              hover:bg-[#F8FAF9]
              focus:outline-none
              focus:ring-2
              focus:ring-[#087554]/15
            "
          >
            View All News

            <span
              className="
                text-base
                text-[#087554]
              "
            >
              →
            </span>
          </Link>

          <button
            type="button"
            onClick={() => scrollSlider("previous")}
            aria-label="Previous news"
            className="
              hidden h-10 w-10
              place-items-center
              rounded-full
              border border-[#DFE5E2]
              bg-white
              text-[#A0AAA5]
              transition-all
              hover:border-[#BFD0C8]
              hover:text-[#087554]
              focus:outline-none
              focus:ring-2
              focus:ring-[#087554]/15
              sm:grid
            "
          >
            <ArrowLeft />
          </button>

          <button
            type="button"
            onClick={() => scrollSlider("next")}
            aria-label="Next news"
            className="
              hidden h-10 w-10
              place-items-center
              rounded-full
              bg-[#087554]
              text-white
              shadow-[0_4px_14px_rgba(8,117,84,0.18)]
              transition-all
              hover:bg-[#066448]
              focus:outline-none
              focus:ring-2
              focus:ring-[#087554]/20
              sm:grid
            "
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={sliderRef}
        className="
          flex snap-x snap-mandatory
          gap-4
          overflow-x-auto
          pb-3
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {section.data.map((news) => (
          <NewsCard
            key={news.news_id}
            news={news}
          />
        ))}
      </div>
    </>
  );
};

export default NewsPreview;