const RankingSkeleton = () => <div className="space-y-3" aria-label="Loading team rankings">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />)}</div>;

export default RankingSkeleton;
