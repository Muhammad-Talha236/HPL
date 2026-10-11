
import { useId } from "react";
import { BarChart3, ShieldCheck } from "lucide-react";

const number = new Intl.NumberFormat("en-PK");

function ChartPanel({ title, icon: Icon, action, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#10213F]">
          <Icon size={18} className="text-[#10213F]" />
          {title}
        </h2>
        {action}
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

export function UserRegistrationsChart({
  months = [],
  year,
  years = [],
  onYearChange,
}) {
  const gradientId = useId().replace(/:/g, "");

  const width = 720;
  const height = 245;
  const left = 38;
  const right = 15;
  const top = 14;
  const bottom = 35;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maxCount = Math.max(
    0,
    ...months.map((item) => Number(item.count) || 0)
  );

  const tickStep = Math.max(1, Math.ceil(maxCount / 4));
  const maxY = tickStep * 4;

  const x = (index) =>
    left +
    (index * plotWidth) / Math.max(1, months.length - 1);

  const y = (count) =>
    top + plotHeight - ((Number(count) || 0) / maxY) * plotHeight;

  const points = months.map((item, index) => ({
    x: x(index),
    y: y(item.count),
    label: item.label,
    count: Number(item.count) || 0,
  }));

  const line = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${
        top + plotHeight
      } L ${points[0].x} ${top + plotHeight} Z`
    : "";

  return (
    <ChartPanel
      title="User Registrations"
      icon={BarChart3}
      action={
        <select
          aria-label="Select registration year"
          value={year}
          onChange={(event) =>
            onYearChange(Number(event.target.value))
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#078052]"
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option === new Date().getFullYear()
                ? "This Year"
                : option}
              {" "}
              ({option})
            </option>
          ))}
        </select>
      }
    >
      <div className="h-[235px] w-full sm:h-[265px]">
        {points.length ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Monthly user registrations for ${year}`}
            className="h-full w-full"
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#12A867"
                  stopOpacity="0.27"
                />
                <stop
                  offset="100%"
                  stopColor="#12A867"
                  stopOpacity="0.025"
                />
              </linearGradient>
            </defs>

            {Array.from({ length: 5 }, (_, index) => {
              const tick = index * tickStep;
              const position = y(tick);

              return (
                <g key={index}>
                  <line
                    x1={left}
                    y1={position}
                    x2={width - right}
                    y2={position}
                    stroke="#E9EEF4"
                  />
                  <text
                    x={left - 9}
                    y={position + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#94A3B8"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {points.map((point, index) => (
              <line
                key={`vertical-${index}`}
                x1={point.x}
                x2={point.x}
                y1={top}
                y2={top + plotHeight}
                stroke="#F1F5F9"
              />
            ))}

            <path d={area} fill={`url(#${gradientId})`} />

            <path
              d={line}
              fill="none"
              stroke="#078052"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#078052"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                >
                  <title>
                    {`${point.label}: ${point.count} registrations`}
                  </title>
                </circle>
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748B"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            No registration data available.
          </div>
        )}
      </div>
    </ChartPanel>
  );
}

export function TeamsStatusChart({ statuses = [] }) {
  const total = statuses.reduce(
    (sum, item) => sum + (Number(item.count) || 0),
    0
  );

  let position = 0;

  const gradient = total
    ? `conic-gradient(${statuses
        .map((item) => {
          const start = position;
          position += ((Number(item.count) || 0) / total) * 100;

          return `${item.color || "#64748B"} ${start}% ${position}%`;
        })
        .join(", ")})`
    : "#E2E8F0";

  return (
    <ChartPanel title="Teams by Status" icon={ShieldCheck}>
      <div className="flex min-h-[235px] flex-wrap items-center justify-center gap-7 sm:min-h-[265px]">
        <div
          className="relative grid h-[180px] w-[180px] shrink-0 place-items-center rounded-full"
          style={{ background: gradient }}
          role="img"
          aria-label={`${total} teams grouped by operational status`}
        >
          <div className="flex h-[119px] w-[119px] flex-col items-center justify-center rounded-full bg-white">
            <strong className="text-[30px] font-extrabold leading-none text-[#10213F]">
              {number.format(total)}
            </strong>
            <span className="mt-2 text-xs text-slate-500">
              Total Teams
            </span>
          </div>
        </div>

        <div className="min-w-[135px] space-y-4">
          {statuses.length ? (
            statuses.map((item) => (
              <div key={item.status} className="flex items-start gap-2">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: item.color || "#64748B",
                  }}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-600">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#10213F]">
                    {number.format(item.count)}
                    <span className="ml-1 font-normal text-slate-500">
                      ({total
                        ? Math.round((item.count / total) * 100)
                        : 0}
                      %)
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">
              No teams registered yet.
            </p>
          )}
        </div>
      </div>
    </ChartPanel>
  );
}
