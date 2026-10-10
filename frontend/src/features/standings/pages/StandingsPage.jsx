import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Info,
  ShieldCheck,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import standingsBanner from "../../../assets/hunza-football-hero-alt.png";
import CompetitionSelector from "../components/CompetitionSelector";
import StandingsSkeleton from "../components/StandingsSkeleton";
import StandingsTable from "../components/StandingsTable";
import {
  getCompetitionStandings,
  getStandingsCompetitions,
} from "../services/standingsService";
import {
  formatStandingsUpdatedAt,
  getLatestStandingUpdate,
} from "../utils/standingsFormatters";

const genderLabel = (value) => {
  if (value === "MEN") return "Men";
  if (value === "WOMEN") return "Women";
  return value || "-";
};

const shortDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm">
    <Icon size={15} className="mt-0.5 shrink-0 text-[#0b6548]" />
    <div>
      <span className="block text-meta text-[#7d899a]">{label}</span>
      <strong className="mt-0.5 block font-semibold text-[#27364c]">{value || "-"}</strong>
    </div>
  </div>
);

const Message = ({ tone = "neutral", text, action, actionLabel, compact = false }) => (
  <div
    role={tone === "neutral" ? undefined : "alert"}
    className={`rounded-lg border ${compact ? "p-3" : "p-5"} ${
      tone === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-[#e2e9e6] bg-white text-[#65758b]"
    }`}
  >
    <p className="text-[11px] font-medium">{text}</p>
    {action && (
      <button
        type="button"
        onClick={action}
        className="mt-2 rounded border border-current/25 px-3 py-1.5 text-[9px] font-bold transition hover:bg-black/[0.04]"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const StandingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [competitionsState, setCompetitionsState] = useState({
    data: [],
    status: "loading",
  });
  const [standingsState, setStandingsState] = useState({ data: [], status: "loading" });
  const [seasonId, setSeasonId] = useState("");
  const [gender, setGender] = useState("");
  const requestedCompetitionId = searchParams.get("competition");

  const loadCompetitions = async () => {
    setCompetitionsState((current) => ({ ...current, status: "loading" }));

    try {
      const data = await getStandingsCompetitions();
      setCompetitionsState({ data, status: "success" });
    } catch {
      setCompetitionsState({ data: [], status: "error" });
    }
  };

  useEffect(() => {
    let active = true;

    getStandingsCompetitions()
      .then((data) => {
        if (active) setCompetitionsState({ data, status: "success" });
      })
      .catch(() => {
        if (active) setCompetitionsState({ data: [], status: "error" });
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedCompetition = useMemo(() => {
    if (competitionsState.status !== "success" || !competitionsState.data.length) {
      return null;
    }

    if (requestedCompetitionId) {
      return competitionsState.data.find(
        (competition) => String(competition.competition_id) === requestedCompetitionId,
      ) || null;
    }

    return competitionsState.data.find((competition) => competition.status === "ACTIVE")
      || competitionsState.data[0];
  }, [competitionsState, requestedCompetitionId]);

  const invalidSelection = Boolean(
    requestedCompetitionId
      && competitionsState.status === "success"
      && !selectedCompetition,
  );
  const selectedSeasonId = seasonId || String(selectedCompetition?.season_id || "");
  const selectedGender = gender || selectedCompetition?.gender || "";

  useEffect(() => {
    let active = true;

    if (!selectedCompetition) {
      return () => {
        active = false;
      };
    }

    getCompetitionStandings(selectedCompetition.competition_id)
      .then((data) => {
        if (active) setStandingsState({ data, status: "success" });
      })
      .catch(() => {
        if (active) setStandingsState({ data: [], status: "error" });
      });

    return () => {
      active = false;
    };
  }, [selectedCompetition]);

  const updateCompetition = (competitionId) => {
    setStandingsState({ data: [], status: "loading" });
    setSearchParams(competitionId ? { competition: competitionId } : {});
  };

  const findCompetition = (nextSeasonId, nextGender) => (
    competitionsState.data.find(
      (competition) => String(competition.season_id) === String(nextSeasonId)
        && competition.gender === nextGender,
    ) || null
  );

  const changeSeason = (nextSeasonId) => {
    const matchingCompetition = findCompetition(nextSeasonId, selectedGender)
      || competitionsState.data.find(
        (competition) => String(competition.season_id) === String(nextSeasonId),
      );

    setSeasonId(nextSeasonId);
    setGender(matchingCompetition?.gender || "");
    if (matchingCompetition) updateCompetition(matchingCompetition.competition_id);
  };

  const changeGender = (nextGender) => {
    const matchingCompetition = findCompetition(selectedSeasonId, nextGender);
    setGender(nextGender);
    if (matchingCompetition) updateCompetition(matchingCompetition.competition_id);
  };

  const retryStandings = async () => {
    if (!selectedCompetition) return;

    setStandingsState({ data: [], status: "loading" });
    try {
      const data = await getCompetitionStandings(selectedCompetition.competition_id);
      setStandingsState({ data, status: "success" });
    } catch {
      setStandingsState({ data: [], status: "error" });
    }
  };

  const updatedAt = formatStandingsUpdatedAt(
    getLatestStandingUpdate(standingsState.data),
  );

  const hasSelectedCompetition = selectedCompetition && !invalidSelection;

  return (
    <main className="min-h-screen bg-[#f6f9f8] pb-12 pt-[76px] text-[#13223a]">
      <section
        className="relative h-[146px] overflow-hidden border-b border-[#e5ece9] bg-[#e6f0ef]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(247,251,250,.97) 0%, rgba(247,251,250,.86) 38%, rgba(230,240,239,.2) 100%), url(${standingsBanner})`,
          backgroundPosition: "center 31%",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto h-full max-w-[1200px] px-5 py-4 sm:px-7 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-meta font-semibold text-[#4e5d70]">
            <Link to="/" className="transition hover:text-[#0b6d4b]">Home</Link>
            <span className="mx-1.5 text-[#9ba7b4]">›</span>
            <span>Standings</span>
          </nav>
          <div className="mt-2">
            <h1 className="text-page-title tracking-[-.04em] text-[#101d36]">
              Team Standings
            </h1>
            <p className="mt-1 text-sm text-[#53647b]">
              View the latest standings of all teams across seasons and competitions.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-7 lg:px-8">
        {competitionsState.status === "error" && (
          <div className="mt-3">
            <Message
              tone="error"
              text="Unable to load competitions right now."
              action={loadCompetitions}
              actionLabel="Try again"
            />
          </div>
        )}

        {competitionsState.status === "success" && !competitionsState.data.length && (
          <div className="mt-3"><Message text="No competitions are available yet." /></div>
        )}

        {invalidSelection && (
          <div className="mt-3">
            <Message
              tone="warning"
              text="The selected competition could not be found."
              action={() => updateCompetition("")}
              actionLabel="View available competitions"
            />
          </div>
        )}

        {hasSelectedCompetition ? (
          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="min-w-0">
              <CompetitionSelector
                competitions={competitionsState.data}
                selectedId={selectedCompetition.competition_id}
                seasonId={selectedSeasonId}
                gender={selectedGender}
                onChange={updateCompetition}
                onSeasonChange={changeSeason}
                onGenderChange={changeGender}
                loading={competitionsState.status === "loading"}
              />

              <section className="mt-3 min-w-0 rounded-lg border border-[#e4ebe8] bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,.025)] sm:p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={15} className="text-[#12213a]" />
                    <h2 className="text-card-title tracking-[-.02em] text-[#14223a]">
                      {selectedCompetition.name}
                    </h2>
                    <span className="rounded bg-[#e9edf0] px-2 py-0.5 text-meta font-semibold text-[#4f5e70]">
                      {genderLabel(selectedCompetition.gender)}
                    </span>
                  </div>
                  {updatedAt && (
                    <span className="inline-flex items-center gap-1 text-meta font-medium text-[#7b889a]">
                      <Clock3 size={12} /> Last Updated: {updatedAt}
                    </span>
                  )}
                </div>

                {standingsState.status === "loading" && <StandingsSkeleton />}
                {standingsState.status === "error" && (
                  <Message
                    tone="error"
                    text="Unable to load standings right now."
                    action={retryStandings}
                    actionLabel="Try again"
                    compact
                  />
                )}
                {standingsState.status === "success" && !standingsState.data.length && (
                  <Message text="No standings are available for this competition yet." compact />
                )}
                {standingsState.status === "success" && standingsState.data.length > 0 && (
                  <StandingsTable standings={standingsState.data} />
                )}
              </section>
            </div>

            <aside className="space-y-3">
              <section className="rounded-lg border border-[#e4ebe8] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,.025)]">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-[#16243c]" />
                  <h2 className="text-card-title text-[#17243b]">Competition Info</h2>
                </div>
                <div
                  role="img"
                  aria-label="Competition logo unavailable"
                  className="mx-auto mt-3 grid h-14 w-20 place-items-center rounded-full bg-[#f6f9f8] text-[#bd8b1e]"
                >
                  <Trophy size={34} strokeWidth={1.6} />
                </div>
                <h3 className="mt-1 text-center text-lg font-bold text-[#16243c]">
                  {selectedCompetition.name}
                </h3>
                <div className="mt-1 flex justify-center gap-1">
                  <span className="rounded bg-[#edf1f3] px-1.5 py-0.5 text-meta font-semibold text-[#5c697a]">
                    {selectedCompetition.season?.name || "-"}
                  </span>
                  <span className="rounded bg-[#edf1f3] px-1.5 py-0.5 text-meta font-semibold text-[#5c697a]">
                    {genderLabel(selectedCompetition.gender)}
                  </span>
                </div>
                {selectedCompetition.description && (
                  <p className="mt-3 text-center text-sm leading-5 text-[#637287]">
                    {selectedCompetition.description}
                  </p>
                )}
                <div className="mt-3 space-y-3 border-t border-[#edf1ef] pt-3">
                  <InfoRow icon={CalendarDays} label="Season" value={selectedCompetition.season?.name} />
                  <InfoRow icon={UsersRound} label="Gender" value={genderLabel(selectedCompetition.gender)} />
                  <InfoRow
                    icon={ShieldCheck}
                    label="Total Teams"
                    value={standingsState.status === "success" ? standingsState.data.length : "-"}
                  />
                  <InfoRow
                    icon={CalendarDays}
                    label="Duration"
                    value={`${shortDate(selectedCompetition.competition_start_date)} - ${shortDate(selectedCompetition.competition_end_date)}`}
                  />
                </div>
              </section>

              <section className="rounded-lg border border-[#e4ebe8] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,.025)]">
                <div className="flex items-center gap-2">
                  <Info size={13} className="text-[#16243c]" />
                  <h2 className="text-[11px] font-extrabold text-[#17243b]">Legend</h2>
                </div>
                <div className="mt-3 space-y-1.5 text-[8px] font-medium text-[#58697e]">
                  <p className="flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center rounded bg-[#0b8a5a] text-[8px] font-bold text-white">1</span>
                    Champion / title winner
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center rounded bg-[#edf1f3] text-[8px] font-bold text-[#5d6a7c]">2</span>
                    Leading positions
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center rounded bg-[#edf1f3] text-[8px] font-bold text-[#5d6a7c]">4</span>
                    Regular positions
                  </p>
                </div>
                <div className="mt-3 border-t border-[#edf1ef] pt-3">
                  <h3 className="text-[10px] font-extrabold text-[#17243b]">Form Guide</h3>
                  <div className="mt-2 flex items-center justify-between text-[8px] font-medium text-[#65758a]">
                    <span className="flex items-center gap-1"><b className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#159568] text-white">W</b>Win</span>
                    <span className="flex items-center gap-1"><b className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#f3bf49] text-[#634600]">D</b>Draw</span>
                    <span className="flex items-center gap-1"><b className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#ef3f4d] text-white">L</b>Loss</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        ) : competitionsState.status === "loading" ? (
          <div className="mt-3">
            <CompetitionSelector
              competitions={[]}
              selectedId=""
              seasonId=""
              gender=""
              onChange={() => {}}
              onSeasonChange={() => {}}
              onGenderChange={() => {}}
              loading
            />
          </div>
        ) : null}
      </div>
    </main>
  );
};

export default StandingsPage;
