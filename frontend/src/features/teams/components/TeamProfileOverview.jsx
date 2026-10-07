import {
  ArrowRight,
  CalendarDays,
  CircleDot,
  Clock3,
  MapPin,
  Medal,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import logo from "../../../assets/logo.png";

export const teamTabs = [
  { id: "overview", label: "Overview", icon: Shield },
  { id: "players", label: "Players", icon: Users },
  { id: "staff", label: "Staff", icon: Users },
  { id: "matches", label: "Matches", icon: CalendarDays },
  { id: "statistics", label: "Statistics", icon: Trophy },
  { id: "gallery", label: "Gallery", icon: CircleDot },
];

const CardHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#07182d]">
      {title}
    </h2>

    {action && (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#078052] hover:text-[#055f3e]"
      >
        {action}
        <ArrowRight size={14} />
      </button>
    )}
  </div>
);

const EmptyState = ({ children }) => (
  <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-[#dfe7e4] bg-[#fafcfb] px-5 text-center text-sm text-[#7b8794]">
    {children}
  </div>
);

const TeamTabs = ({ activeTab, onChange }) => (
  <div className="border-b border-[#e5ebe8]">
    <div className="grid grid-cols-3 gap-1 px-3 py-3 md:grid-cols-6">
      {teamTabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-3 text-[11px] font-semibold transition ${
              active
                ? "bg-[#078052] text-white shadow-[0_5px_14px_rgba(7,128,82,.18)]"
                : "text-[#53617a] hover:bg-[#f4f8f6] hover:text-[#078052]"
            }`}
          >
            <Icon size={14} />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const AboutTeam = ({ team }) => (
  <section className="rounded-xl border border-[#e1e8e5] bg-white p-5">
    <CardHeader title="About the Team" />

    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(210px,.8fr)]">
      <p className="text-[13px] leading-6 text-[#596985]">
        {team?.description ||
          `${team?.name} represents the footballing community of Hunza and competes in the Hunza Premier League.`}
      </p>

      <div className="relative rounded-lg bg-[#f5f8f7] px-6 py-5">
        <span className="absolute left-4 top-2 text-[42px] font-black leading-none text-[#8796ac]">
          “
        </span>
        <p className="pl-4 pt-4 text-center text-[13px] italic leading-5 text-[#506078]">
          United by passion,
          <br />
          stronger in every match.
        </p>
        <p className="mt-3 text-right text-[11px] font-medium text-[#77859a]">
          — {team?.name}
        </p>
      </div>
    </div>
  </section>
);

const SquadPlayerCard = ({ teamPlayer }) => {
  const player = teamPlayer?.player || teamPlayer?.Player || teamPlayer;
  const jersey = teamPlayer?.jersey_number ?? player?.jersey_number ?? "--";
  const position = player?.position || teamPlayer?.position || "Player";
  const shortPosition = position.split(" ")[0].slice(0, 2).toUpperCase();

  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl border border-[#dde6e2] bg-white">
      <span className="absolute left-3 top-2 z-10 text-[22px] font-black text-[#07182d]">
        {jersey}
      </span>
      <span className="absolute right-2 top-2 z-10 rounded-md bg-[#078052] px-2 py-1 text-[9px] font-extrabold uppercase text-white">
        {shortPosition}
      </span>

      <div className="flex h-[112px] items-end justify-center bg-[#f1f6f3] pt-7">
        {player?.profile_photo ? (
          <img
            src={player.profile_photo}
            alt={player?.name || "Player"}
            className="h-[102px] w-[92px] object-cover object-top"
          />
        ) : (
          <div className="mb-3 grid h-[72px] w-[72px] place-items-center rounded-full bg-[#dce9e3]">
            <Users size={32} className="text-[#789087]" />
          </div>
        )}
      </div>

      <div className="px-2.5 pb-3 pt-2 text-center">
        <h3 className="truncate text-[12px] font-extrabold text-[#07182d]">
          {player?.name || "Unnamed Player"}
        </h3>
        <p className="mt-1 truncate text-[10px] font-medium text-[#738197]">
          🇵🇰 {position}
        </p>
      </div>
    </article>
  );
};

const TeamSquad = ({ state, onViewAll }) => (
  <section className="rounded-xl border border-[#e1e8e5] bg-white p-5">
    <CardHeader title="Team Squad" action="View All Players" onAction={onViewAll} />

    <div className="mt-4">
      {state.status === "loading" && <EmptyState>Loading squad…</EmptyState>}
      {state.status === "error" && (
        <EmptyState>Squad information is unavailable right now.</EmptyState>
      )}
      {state.status === "success" && state.data.length === 0 && (
        <EmptyState>No active squad members are available yet.</EmptyState>
      )}
      {state.status === "success" && state.data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {state.data.slice(0, 5).map((teamPlayer) => (
            <SquadPlayerCard
              key={teamPlayer.team_player_id || teamPlayer.player_id}
              teamPlayer={teamPlayer}
            />
          ))}
        </div>
      )}
    </div>
  </section>
);

export const TeamMainContent = ({ team, squadState, activeTab, setActiveTab }) => (
  <div className="min-w-0 overflow-hidden rounded-xl border border-[#dfe7e4] bg-white shadow-[0_5px_18px_rgba(15,23,42,.05)]">
    <TeamTabs activeTab={activeTab} onChange={setActiveTab} />

    {activeTab === "overview" ? (
      <div className="space-y-4 p-4">
        <AboutTeam team={team} />
        <TeamSquad state={squadState} onViewAll={() => setActiveTab("players")} />
      </div>
    ) : (
      <div className="p-4">
        <div className="grid min-h-[350px] place-items-center rounded-xl border border-dashed border-[#dce5e1] bg-[#fafcfb] px-6 text-center">
          <div>
            <Shield size={38} className="mx-auto text-[#9aaba4]" />
            <h2 className="mt-4 text-lg font-extrabold text-[#07182d]">
              {teamTabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-2 text-sm text-[#758297]">
              This section will be implemented next.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);

export const KeyStats = ({ squadCount, resultsCount, venue }) => {
  const stats = [
    { icon: Users, value: squadCount, label: "Players" },
    { icon: Trophy, value: resultsCount, label: "Matches" },
    { icon: Shield, value: "HPL", label: "League" },
    { icon: MapPin, value: venue || "TBA", label: "Stadium", small: true },
  ];

  return (
    <section className="rounded-xl border border-[#e1e8e5] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,.035)]">
      <CardHeader title="Key Stats" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, value, label, small }) => (
          <div
            key={label}
            className="flex min-h-[78px] min-w-0 items-center gap-3 rounded-lg border border-[#e6ece9] bg-[#f8faf9] px-3"
          >
            <Icon size={24} className="shrink-0 text-[#078052]" />
            <div className="min-w-0">
              <p
                title={String(value)}
                className={`font-extrabold leading-tight text-[#07182d] ${
                  small ? "truncate text-[11px]" : "text-[20px]"
                }`}
              >
                {value}
              </p>
              <p className="mt-1 text-[10px] font-medium text-[#7a8799]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const TeamKitCard = () => (
  <section className="rounded-xl border border-[#dfe7e4] bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,.045)]">
    <CardHeader title="Team Kit" />
    <div className="mt-4 grid min-h-[135px] place-items-center rounded-lg bg-[#f8faf9] px-5 text-center">
      <div>
        <Shield size={34} className="mx-auto text-[#93a39c]" />
        <p className="mt-3 text-[11px] font-semibold text-[#637168]">
          Team kit information will be available here.
        </p>
      </div>
    </div>
  </section>
);

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const matchDate = (value) => {
  const date = parseDate(value);
  if (!date) return { day: "--", month: "TBA" };

  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
  };
};

const matchTime = (match) => {
  const raw = match?.start_time || match?.startTime || match?.match_date;
  if (!raw) return "TBA";

  if (/^\d{2}:\d{2}/.test(raw)) {
    const [hours, minutes] = raw.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const date = parseDate(raw);
  return date
    ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "TBA";
};

const teamOf = (match, side) =>
  side === "home"
    ? match?.home_team || match?.homeTeam || match?.home_team_data
    : match?.away_team || match?.awayTeam || match?.away_team_data;

const resultFor = (match, currentTeamId) => {
  const home = Number(match?.home_score ?? 0);
  const away = Number(match?.away_score ?? 0);
  if (home === away) return "Draw";

  const isHome =
    Number(currentTeamId) === Number(match?.home_team_id ?? match?.homeTeamId);

  return (isHome ? home : away) > (isHome ? away : home) ? "Win" : "Loss";
};

const MatchRow = ({ match, currentTeamId, type }) => {
  const home = teamOf(match, "home");
  const away = teamOf(match, "away");
  const date = matchDate(match?.match_date || match?.matchDate);
  const result = type === "result" ? resultFor(match, currentTeamId) : null;

  return (
    <div className="grid min-h-[68px] grid-cols-[48px_minmax(0,1fr)] items-center gap-2 border-b border-[#edf1ef] py-2 last:border-b-0">
      <div className="text-center">
        <p className="text-[13px] font-extrabold text-[#33425c]">{date.day}</p>
        <p className="mt-0.5 text-[8px] font-medium leading-3 text-[#7b889b]">
          {date.month}
        </p>
      </div>

      <div className="flex min-w-0 items-center gap-1.5">
        <img
          src={home?.logo || logo}
          alt=""
          className="h-5 w-5 shrink-0 object-contain"
          onError={(event) => {
            event.currentTarget.src = logo;
          }}
        />
        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-[#1b2940]">
          {home?.name || "Team"}
        </span>

        <span className="shrink-0 text-[10px] font-extrabold text-[#77849a]">
          {type === "result"
            ? `${match?.home_score ?? 0} - ${match?.away_score ?? 0}`
            : "vs"}
        </span>

        <img
          src={away?.logo || logo}
          alt=""
          className="h-5 w-5 shrink-0 object-contain"
          onError={(event) => {
            event.currentTarget.src = logo;
          }}
        />
        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-[#1b2940]">
          {away?.name || "Team"}
        </span>

        {type === "result" ? (
          <span
            className={`ml-1 shrink-0 rounded-full px-2.5 py-1 text-[8px] font-bold ${
              result === "Win"
                ? "bg-[#dcf5e9] text-[#078052]"
                : result === "Draw"
                  ? "bg-[#e9eef5] text-[#61708a]"
                  : "bg-[#fde9e7] text-[#c3483f]"
            }`}
          >
            {result}
          </span>
        ) : (
          <span className="ml-1 inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-[#56657d]">
            <Clock3 size={11} />
            {matchTime(match)}
          </span>
        )}
      </div>
    </div>
  );
};

export const MatchesCard = ({
  title,
  state,
  currentTeamId,
  type,
  onViewAll,
}) => (
  <section className="h-full rounded-xl border border-[#dfe7e4] bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,.045)]">
    <CardHeader title={title} action="View All" onAction={onViewAll} />

    <div className="mt-3">
      {state.status === "loading" && <EmptyState>Loading matches…</EmptyState>}
      {state.status === "error" && (
        <EmptyState>Match information is unavailable right now.</EmptyState>
      )}
      {state.status === "success" && state.data.length === 0 && (
        <EmptyState>
          {type === "result"
            ? "No completed matches are available yet."
            : "No upcoming matches are scheduled yet."}
        </EmptyState>
      )}
      {state.status === "success" &&
        state.data
          .slice(0, 3)
          .map((match) => (
            <MatchRow
              key={match.match_id}
              match={match}
              currentTeamId={currentTeamId}
              type={type}
            />
          ))}
    </div>
  </section>
);

export const AchievementsCard = () => (
  <section className="h-full rounded-xl border border-[#dfe7e4] bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,.045)]">
    <CardHeader title="Achievements" />
    <div className="mt-4 flex min-h-[160px] flex-col items-center justify-center rounded-lg bg-[#fafcfb] px-5 text-center">
      <Medal size={35} className="text-[#d29b28]" />
      <p className="mt-3 text-[11px] font-semibold text-[#657388]">
        No achievements have been recorded yet.
      </p>
    </div>
  </section>
);
