const PlayerCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B1D2F]" aria-hidden="true">
    <div className="aspect-[16/10] animate-pulse bg-white/[0.07]" />
    <div className="space-y-4 p-4">
      <div className="h-5 w-20 animate-pulse rounded-full bg-white/[0.07]" />
      <div className="h-6 w-3/4 animate-pulse rounded bg-white/[0.07]" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.07]" />
      <div className="h-10 animate-pulse rounded-md bg-white/[0.07]" />
    </div>
  </div>
);

export default PlayerCardSkeleton;
