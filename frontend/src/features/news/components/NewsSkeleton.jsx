const NewsSkeleton = ({ lead = false }) => (
  <div className={`animate-pulse overflow-hidden rounded-lg border border-[#e0e8e6] bg-white ${lead ? "lg:grid lg:grid-cols-[1.72fr_.82fr]" : ""}`}>
    <div className={lead ? "aspect-[16/8] bg-[#e8efed] lg:aspect-auto lg:min-h-[260px]" : "aspect-[16/7.5] bg-[#e8efed]"} />
    <div className="space-y-3 p-4">
      <span className="block h-3 w-24 rounded bg-[#e8efed]" />
      <span className="block h-5 w-4/5 rounded bg-[#e8efed]" />
      <span className="block h-3 w-full rounded bg-[#edf2f1]" />
      <span className="block h-3 w-3/5 rounded bg-[#edf2f1]" />
    </div>
  </div>
);

export const NewsListSkeleton = () => (
  <>
    <NewsSkeleton lead />
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <NewsSkeleton key={index} />)}
    </div>
  </>
);

export const ArticleSkeleton = () => (
  <div className="mx-auto max-w-3xl animate-pulse space-y-6 py-12">
    <span className="block h-3 w-28 rounded bg-[#e8efed]" />
    <span className="block h-12 w-4/5 rounded bg-[#e8efed]" />
    <span className="block h-5 w-1/3 rounded bg-[#edf2f1]" />
    <div className="aspect-[16/9] rounded-lg bg-[#e8efed]" />
    {Array.from({ length: 5 }, (_, index) => <span key={index} className="block h-5 rounded bg-[#edf2f1]" />)}
  </div>
);
