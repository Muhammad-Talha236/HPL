import { CalendarDays, Trophy, UsersRound } from "lucide-react";

const genderLabel = (value) => value === "MEN" ? "Men" : value === "WOMEN" ? "Women" : value;
const Field = ({ icon: Icon, label, children }) => <label className="flex min-w-0 items-center gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center text-[#0f2039]"><Icon size={16} strokeWidth={2} /></span><span className="min-w-0 flex-1"><span className="mb-1 block text-[9px] font-bold text-[#26364c]">{label}</span>{children}</span></label>;
const selectClass = "h-8 w-full rounded-md border border-[#d9e4e0] bg-white px-2 text-[9px] font-semibold text-[#182840] outline-none transition focus:border-[#0b6d4b] focus:ring-2 focus:ring-[#0b6d4b]/15 disabled:cursor-not-allowed disabled:bg-[#f7f9f8]";

const CompetitionSelector = ({ competitions, selectedId, seasonId, gender, onChange, onSeasonChange, onGenderChange, loading }) => {
  const seasons = [...new Map(competitions.filter((competition) => competition.season?.name).map((competition) => [competition.season_id, competition.season.name])).entries()];
  const visibleCompetitions = competitions.filter((competition) => (!seasonId || String(competition.season_id) === String(seasonId)) && (!gender || competition.gender === gender));
  const genders = [...new Set(
    competitions
      .filter((competition) => !seasonId || String(competition.season_id) === String(seasonId))
      .map((competition) => competition.gender)
      .filter(Boolean),
  )];

  return <section aria-label="Standings filters" className="rounded-lg border border-[#e4ebe8] bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,.025)]"><div className="grid gap-3 sm:grid-cols-3"><Field icon={CalendarDays} label="Season"><select value={seasonId || ""} onChange={(event) => onSeasonChange(event.target.value)} disabled={loading} className={selectClass}>{seasons.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></Field><Field icon={Trophy} label="Competition"><select value={selectedId || ""} onChange={(event) => onChange(event.target.value)} disabled={loading || !visibleCompetitions.length} className={selectClass}>{visibleCompetitions.map((competition) => <option key={competition.competition_id} value={competition.competition_id}>{competition.name}</option>)}</select></Field><Field icon={UsersRound} label="Gender"><select value={gender || ""} onChange={(event) => onGenderChange(event.target.value)} disabled={loading} className={selectClass}>{genders.map((value) => <option key={value} value={value}>{genderLabel(value)}</option>)}</select></Field></div></section>;
};

export default CompetitionSelector;
