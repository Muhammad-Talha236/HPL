
export default function AdminTeamStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "green",
  loading = false,
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-slate-100 text-slate-600",
    red: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <article className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
          colors[color] || colors.green
        }`}
      >
        <Icon size={23} strokeWidth={2.2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">
          {title}
        </p>

        {loading ? (
          <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-1 text-[27px] font-extrabold leading-none text-[#10213F]">
            {value === null || value === undefined
              ? "â€”"
              : Number(value).toLocaleString("en-PK")}
          </p>
        )}

        <p className="mt-1.5 text-[11px] text-slate-400">
          {subtitle}
        </p>
      </div>
    </article>
  );
}
