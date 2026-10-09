import { CalendarDays, RotateCcw, Shield, Trophy, UsersRound } from "lucide-react";

const selectClass = "mt-1 h-8 w-full rounded-md border border-[#dbe5e2] bg-white px-2 text-[9px] font-semibold text-[#26364c] outline-none transition focus:border-[#087d50] focus:ring-2 focus:ring-[#087d50]/15";

const Field = ({ icon: Icon, label, children }) => (
  <label className="block min-w-0">
    <span className="flex items-center gap-1.5 text-[8px] font-bold text-[#536278]"><Icon size={12} className="text-[#12213a]" />{label}</span>
    {children}
  </label>
);

const MatchFilters = ({ competitions, seasons, teams, filters, onChange, onReset, loading }) => (
  <section aria-label="Match filters" className="rounded-lg border border-[#e0e8e6] bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,.025)]">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.6fr_auto] lg:items-end">
      <Field icon={Trophy} label="Competition">
        <select value={filters.competition} disabled={loading} onChange={(event) => onChange("competition", event.target.value)} className={selectClass}>
          <option value="">All Competitions</option>
          {competitions.map((competition) => <option key={competition.competition_id} value={competition.competition_id}>{competition.name}</option>)}
        </select>
      </Field>
      <Field icon={CalendarDays} label="Season">
        <select value={filters.season} disabled={loading} onChange={(event) => onChange("season", event.target.value)} className={selectClass}>
          <option value="">All Seasons</option>
          {seasons.map((season) => <option key={season.season_id} value={season.season_id}>{season.name}</option>)}
        </select>
      </Field>
      <Field icon={Shield} label="Team">
        <select value={filters.team} disabled={loading} onChange={(event) => onChange("team", event.target.value)} className={selectClass}>
          <option value="">All Teams</option>
          {teams.map((team) => <option key={team.team_id} value={team.team_id}>{team.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field icon={UsersRound} label="From"><input type="date" value={filters.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} className={selectClass} /></Field>
        <Field icon={CalendarDays} label="To"><input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(event) => onChange("dateTo", event.target.value)} className={selectClass} /></Field>
      </div>
      <button type="button" onClick={onReset} className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#dbe5e2] px-3 text-[9px] font-extrabold text-[#526276] transition hover:border-[#087d50] hover:text-[#087d50] focus:outline-none focus:ring-2 focus:ring-[#087d50]/20"><RotateCcw size={12} /> Reset Filters</button>
    </div>
  </section>
);

export default MatchFilters;
