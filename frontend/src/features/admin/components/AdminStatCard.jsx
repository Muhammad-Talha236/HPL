
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-PK").format(Number(value) || 0);

const variants = {
  green: "bg-emerald-50 text-emerald-600",
  blue: "bg-slate-100 text-slate-600",
  purple: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-600",
};

export default function AdminStatCard({
  title,
  value,
  growth,
  icon: Icon,
  variant = "green",
  footer,
}) {
  const hasGrowth =
    growth !== null &&
    growth !== undefined &&
    Number.isFinite(Number(growth));

  const positive = Number(growth) >= 0;

  return (
    <article className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-5 shadow-[0_3px_14px_rgba(15,23,42,0.035)] transition-shadow hover:shadow-md">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
          variants[variant] || variants.green
        }`}
      >
        <Icon size={24} strokeWidth={2.3} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-500">
          {title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <strong className="text-[27px] font-extrabold leading-none tracking-tight text-[#10213F]">
            {formatNumber(value)}
          </strong>

          {hasGrowth && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                positive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {positive ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
              {Math.abs(Number(growth))}%
            </span>
          )}
        </div>

        <p className="mt-1.5 text-[11px] text-slate-400">
          {footer ||
            (hasGrowth
              ? "Compared with last month"
              : "Current total")}
        </p>
      </div>
    </article>
  );
}
