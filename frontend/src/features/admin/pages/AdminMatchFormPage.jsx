import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";

const blank = {
  competition_id: "", season_id: "", home_team_id: "", away_team_id: "",
  venue_id: "", referee_id: "", match_date: "", start_time: "", match_notes: "",
};

const dateValue = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const timeValue = (value) => String(value || "").slice(0, 5);
const errorMessage = (request, fallback) => request.response?.data?.message || fallback;
const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

function TeamIdentity({ team }) {
  if (!team) return <span className="text-slate-400">Not selected</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      {team.logo ? <img src={team.logo} alt="" className="h-7 w-7 rounded-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
      <span className="truncate">{team.name}</span>
    </span>
  );
}

function FieldError({ message }) {
  return message ? <span className="mt-1 block text-xs font-medium text-red-700">{message}</span> : null;
}

export default function AdminMatchFormPage() {
  const { matchId } = useParams();
  const editing = Boolean(matchId);
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [options, setOptions] = useState({ competitions: [], venues: [], referees: [], teams: [] });
  const [busy, setBusy] = useState(editing);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");

  const getOptions = useCallback(async (competitionId) => {
    const response = await apiClient.get("/admin/matches/options", {
      params: competitionId ? { competition_id: competitionId } : {},
    });
    const data = response.data.data;
    setOptions(data);
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setBusy(true);
      setError("");
      try {
        await getOptions();
        if (!editing) return;
        const response = await apiClient.get(`/admin/matches/${matchId}`);
        const match = response.data.data;
        const values = {
          competition_id: String(match.competition.competition_id),
          season_id: String(match.season.season_id),
          home_team_id: String(match.home_team.team_id),
          away_team_id: String(match.away_team.team_id),
          venue_id: String(match.venue.venue_id),
          referee_id: String(match.referee.referee_id),
          match_date: dateValue(match.match_date),
          start_time: timeValue(match.start_time),
          match_notes: match.match_notes || "",
        };
        if (active) setForm(values);
        await getOptions(values.competition_id);
      } catch (request) {
        if (active) setError(errorMessage(request, editing ? "Match could not be loaded." : "Fixture options could not be loaded."));
      } finally {
        if (active) setBusy(false);
      }
    };
    load();
    return () => { active = false; };
  }, [editing, getOptions, matchId]);

  useEffect(() => {
    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) document.getElementById(`match-${firstField}`)?.focus();
  }, [fieldErrors]);

  const change = async (key, value) => {
    setError("");
    setSuccess("");
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    if (key !== "competition_id") {
      setForm((current) => ({ ...current, [key]: value }));
      return;
    }

    const selected = options.competitions.find((item) => String(item.competition_id) === String(value));
    // The season is sourced from the selected competition, preventing an empty
    // value from being sent as numeric zero to the strict create validator.
    setForm((current) => ({
      ...current,
      competition_id: value,
      season_id: selected ? String(selected.season_id) : "",
      home_team_id: "",
      away_team_id: "",
    }));
    try {
      await getOptions(value);
    } catch (request) {
      setError(errorMessage(request, "Teams for this competition could not be loaded."));
    }
  };

  const validateClient = () => {
    const errors = {};
    ["competition_id", "season_id", "home_team_id", "away_team_id", "venue_id", "referee_id", "match_date", "start_time"].forEach((key) => {
      if (!hasValue(form[key])) errors[key] = "This field is required.";
    });
    if (form.home_team_id && form.home_team_id === form.away_team_id) errors.away_team_id = "Home and away teams must be different.";
    return errors;
  };

  const submit = async (event) => {
    event.preventDefault();
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      setError("Please correct the highlighted fields before scheduling the match.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    setFieldErrors({});
    try {
      const payload = {
        venue_id: Number(form.venue_id),
        referee_id: Number(form.referee_id),
        match_date: form.match_date,
        start_time: form.start_time,
        match_notes: form.match_notes || null,
      };
      const response = editing
        ? await apiClient.patch(`/matches/${matchId}`, payload)
        : await apiClient.post("/matches", {
          ...payload,
          competition_id: Number(form.competition_id),
          season_id: Number(form.season_id),
          home_team_id: Number(form.home_team_id),
          away_team_id: Number(form.away_team_id),
        });
      setSuccess(editing ? "Fixture updated. Opening match details…" : "Match scheduled. Opening match details…");
      window.setTimeout(() => navigate(`/admin/matches/${response.data.data.match.match_id}`), 350);
    } catch (request) {
      const responseErrors = request.response?.data?.errors;
      if (Array.isArray(responseErrors)) setFieldErrors(Object.fromEntries(responseErrors.map((item) => [item.field, item.message])));
      setError(errorMessage(request, "Match could not be saved."));
    } finally {
      setBusy(false);
    }
  };

  const competition = options.competitions.find((item) => String(item.competition_id) === form.competition_id);
  const homeTeam = options.teams.find((team) => String(team.team_id) === form.home_team_id);
  const awayTeam = options.teams.find((team) => String(team.team_id) === form.away_team_id);
  const venue = options.venues.find((item) => String(item.venue_id) === form.venue_id);
  const referee = options.referees.find((item) => String(item.referee_id) === form.referee_id);
  const inputClass = (key) => `mt-2 w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 ${fieldErrors[key] ? "border-red-500" : "border-slate-200"}`;

  if (busy && editing && !form.competition_id) return <main className="p-8 text-slate-500">Loading match…</main>;

  return (
    <main className="min-w-0 p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={editing ? `/admin/matches/${matchId}` : "/admin/matches"} className="text-sm font-bold text-emerald-700">← Back to Matches</Link>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{editing ? "Edit Fixture" : "Schedule Match"}</h1>
          <p className="mt-1 text-sm text-slate-500">Use approved competition participants and active match officials.</p>
        </div>
        <div className="flex gap-3">
          <Link to={editing ? `/admin/matches/${matchId}` : "/admin/matches"} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</Link>
          <button form="match-form" type="submit" disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Saving…" : editing ? "Save Fixture" : "Schedule Match"}</button>
        </div>
      </div>

      {error ? <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
      {success ? <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</div> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.75fr)]">
        <form id="match-form" onSubmit={submit} noValidate className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <section>
            <h2 className="text-sm font-extrabold tracking-wide text-slate-900">Competition</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Competition
                <select id="match-competition_id" required disabled={editing} value={form.competition_id} onChange={(event) => change("competition_id", event.target.value)} aria-invalid={Boolean(fieldErrors.competition_id)} className={inputClass("competition_id")}>
                  <option value="">Select competition</option>
                  {options.competitions.map((item) => <option key={item.competition_id} value={item.competition_id}>{item.name} · {item.gender}</option>)}
                </select>
                <FieldError message={fieldErrors.competition_id} />
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Authoritative season</span>
                <span className="mt-2 block font-semibold text-slate-800">{competition ? `${competition.season.name} · ${competition.gender}` : "Select a competition"}</span>
                <input id="match-season_id" type="hidden" value={form.season_id} readOnly />
                <FieldError message={fieldErrors.season_id} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-extrabold tracking-wide text-slate-900">Teams</h2>
            <p className="mt-1 text-xs text-slate-500">Only approved, active participants for the selected competition are available.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {editing ? <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Home team</span><TeamIdentity team={homeTeam} /></div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Away team</span><TeamIdentity team={awayTeam} /></div>
              </> : <>
                <label className="text-sm font-semibold text-slate-700">Home team
                  <select id="match-home_team_id" required disabled={!form.competition_id} value={form.home_team_id} onChange={(event) => change("home_team_id", event.target.value)} aria-invalid={Boolean(fieldErrors.home_team_id)} className={inputClass("home_team_id")}>
                    <option value="">Select eligible home team</option>
                    {options.teams.map((team) => <option key={team.team_id} value={team.team_id}>{team.name}</option>)}
                  </select>
                  <FieldError message={fieldErrors.home_team_id} />
                </label>
                <label className="text-sm font-semibold text-slate-700">Away team
                  <select id="match-away_team_id" required disabled={!form.competition_id} value={form.away_team_id} onChange={(event) => change("away_team_id", event.target.value)} aria-invalid={Boolean(fieldErrors.away_team_id)} className={inputClass("away_team_id")}>
                    <option value="">Select eligible away team</option>
                    {options.teams.filter((team) => String(team.team_id) !== form.home_team_id).map((team) => <option key={team.team_id} value={team.team_id}>{team.name}</option>)}
                  </select>
                  <FieldError message={fieldErrors.away_team_id} />
                </label>
              </>}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-extrabold tracking-wide text-slate-900">Schedule & officials</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Match date<input id="match-match_date" required type="date" value={form.match_date} onChange={(event) => change("match_date", event.target.value)} aria-invalid={Boolean(fieldErrors.match_date)} className={inputClass("match_date")} /><FieldError message={fieldErrors.match_date} /></label>
              <label className="text-sm font-semibold text-slate-700">Kickoff time<input id="match-start_time" required type="time" value={form.start_time} onChange={(event) => change("start_time", event.target.value)} aria-invalid={Boolean(fieldErrors.start_time)} className={inputClass("start_time")} /><FieldError message={fieldErrors.start_time} /></label>
              <label className="text-sm font-semibold text-slate-700">Venue<select id="match-venue_id" required value={form.venue_id} onChange={(event) => change("venue_id", event.target.value)} aria-invalid={Boolean(fieldErrors.venue_id)} className={inputClass("venue_id")}><option value="">Select active venue</option>{options.venues.map((item) => <option key={item.venue_id} value={item.venue_id}>{item.name}{item.city ? ` · ${item.city}` : ""}</option>)}</select><FieldError message={fieldErrors.venue_id} /></label>
              <label className="text-sm font-semibold text-slate-700">Referee<select id="match-referee_id" required value={form.referee_id} onChange={(event) => change("referee_id", event.target.value)} aria-invalid={Boolean(fieldErrors.referee_id)} className={inputClass("referee_id")}><option value="">Select active referee</option>{options.referees.map((item) => <option key={item.referee_id} value={item.referee_id}>{item.name} · {item.license_number}</option>)}</select><FieldError message={fieldErrors.referee_id} /></label>
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Internal match notes<textarea id="match-match_notes" value={form.match_notes} onChange={(event) => change("match_notes", event.target.value)} maxLength="2000" className={`${inputClass("match_notes")} min-h-28 resize-y`} /><FieldError message={fieldErrors.match_notes} /></label>
          </section>
        </form>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
          <h2 className="text-sm font-extrabold tracking-wide text-slate-900">Fixture preview</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Competition</dt><dd className="mt-1 font-semibold text-slate-800">{competition?.name || "Not selected"}</dd>{competition ? <dd className="mt-1 text-slate-500">{competition.season.name} · {competition.gender}</dd> : null}</div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Fixture</dt><dd className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center font-semibold text-slate-800"><span className="min-w-0"><TeamIdentity team={homeTeam} /></span><span className="text-slate-400">vs</span><span className="min-w-0"><TeamIdentity team={awayTeam} /></span></dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Date & kickoff</dt><dd className="mt-1 font-medium text-slate-800">{form.match_date || "Not selected"}{form.start_time ? ` · ${form.start_time}` : ""}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Venue</dt><dd className="mt-1 font-medium text-slate-800">{venue ? `${venue.name}${venue.city ? ` · ${venue.city}` : ""}` : "Not selected"}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Referee</dt><dd className="mt-1 font-medium text-slate-800">{referee ? referee.name : "Not selected"}</dd></div>
          </dl>
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Eligibility, fixture conflicts, venue availability and referee availability are verified by the server when the fixture is saved.</div>
        </aside>
      </div>
    </main>
  );
}
