import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";

const Card = ({ title, children }) => (
  <section className="rounded-xl border border-slate-200 bg-[#FFFFFF] p-5">
    <h2 className="text-sm font-bold text-[#078052]">{title}</h2>
    <div className="mt-4 text-sm text-slate-600">{children}</div>
  </section>
);

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function AdminRefereeDetailsPage() {
  const { refereeId } = useParams();
  const [state, setState] = useState({ status: "loading" });
  const [mode, setMode] = useState("");
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await apiClient.get(`/admin/referees/${refereeId}`);
      setState({ status: "success", referee: response.data.data });
    } catch (error) {
      setState({ status: "error", message: getErrorMessage(error, "Unable to load this referee.") });
    }
  }, [refereeId]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const closeDialog = () => {
    if (!isSubmitting) {
      setMode("");
      setSelected(null);
      setScore("");
      setNotice("");
    }
  };

  const openAccountLink = async () => {
    setNotice("");
    setSelected(null);
    try {
      const response = await apiClient.get("/users", { params: { status: "ACTIVE", page: 1, limit: 20 } });
      setUsers(response.data.data || []);
      setMode("link");
    } catch (error) {
      setNotice(getErrorMessage(error, "Unable to load eligible user accounts."));
    }
  };

  const openEvaluation = async () => {
    setNotice("");
    setSelected(null);
    try {
      const response = await apiClient.get(`/admin/referees/${refereeId}/evaluation-eligible-matches`);
      setMatches(response.data.data || []);
      setMode("evaluation");
    } catch (error) {
      setNotice(getErrorMessage(error, "Unable to load matches eligible for evaluation."));
    }
  };

  const submit = async (request, failureMessage) => {
    setIsSubmitting(true);
    setNotice("");
    try {
      await request();
      setMode("");
      setSelected(null);
      setScore("");
      await load();
    } catch (error) {
      setNotice(getErrorMessage(error, failureMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.status === "loading") return <div className="p-8 text-slate-600" role="status">Loading refereeâ€¦</div>;
  if (state.status === "error") return <div className="p-8 text-[#10213F]/70"><p role="alert">{state.message}</p><button type="button" onClick={load} className="mt-4 rounded border border-[#078052]/70 px-3 py-2 text-xs font-bold text-[#078052]">RETRY</button></div>;

  const referee = state.referee;
  const isActive = referee.status === "ACTIVE";
  const submitLifecycle = () => submit(() => apiClient.patch(`/referees/${referee.referee_id}/${isActive ? "deactivate" : "activate"}`), "Unable to update referee status.");
  const submitAccountLink = () => selected && submit(() => apiClient.post(`/referees/${referee.referee_id}/link-account`, { user_id: selected.user_id }), "Unable to link this account.");
  const submitEvaluation = () => selected && submit(() => apiClient.post(`/referees/${referee.referee_id}/evaluations`, { match_id: selected.match_id, score: Number(score) }), "Unable to save this evaluation.");

  return <div className="mx-auto max-w-7xl p-5 sm:p-8">
    <Link to="/admin/referees" className="text-sm font-medium text-[#078052] hover:text-[#10213F]">â† REFEREES</Link>
    <header className="mt-5 flex flex-wrap justify-between gap-4 rounded-xl border border-slate-200 bg-[#FFFFFF] p-5"><div><h1 className="text-2xl font-extrabold text-[#078052]">{referee.name}</h1><p className="mt-1 text-sm text-slate-600">License: {referee.license_number}</p><p className="mt-2 text-xs font-bold text-[#078052]">{referee.status}</p></div><div className="flex flex-wrap gap-2"><Link to={`/admin/referees/${referee.referee_id}/edit`} className="rounded border border-slate-200 px-3 py-2 text-xs font-bold hover:border-white/50">EDIT</Link>{!referee.user && <button type="button" onClick={openAccountLink} className="rounded border border-[#078052]/60 px-3 py-2 text-xs font-bold text-[#078052] hover:bg-[#078052]/10">LINK ACCOUNT</button>}<button type="button" onClick={openEvaluation} className="rounded border border-slate-200 px-3 py-2 text-xs font-bold hover:border-white/50">ADD EVALUATION</button><button type="button" onClick={() => { setNotice(""); setMode("lifecycle"); }} className="rounded border border-[#078052]/60 px-3 py-2 text-xs font-bold text-[#078052] hover:bg-[#078052]/10">{isActive ? "DEACTIVATE" : "ACTIVATE"}</button></div></header>
    {notice && !mode && <p role="alert" className="mt-4 rounded border border-[#078052]/40 bg-[#078052]/10 p-3 text-sm text-[#078052]">{notice}</p>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]"><main className="space-y-5"><Card title="REFEREE INFORMATION"><p>Phone: {referee.phone || "â€”"}</p><p className="mt-2">{[referee.city, referee.district, referee.region].filter(Boolean).join(", ") || "â€”"}</p></Card><Card title="ASSIGNMENTS">{referee.matches?.length ? <div className="space-y-3">{referee.matches.map((match) => <p key={match.match_id}>{match.home_team.name} vs {match.away_team.name} Â· {match.competition.name} Â· {match.status}</p>)}</div> : <p>No assignments.</p>}</Card><Card title="EVALUATIONS">{referee.evaluations?.length ? <div className="space-y-3">{referee.evaluations.map((evaluation) => <p key={evaluation.evaluation_id}>Match #{evaluation.match.match_id} Â· {evaluation.score}/10</p>)}</div> : <p>No evaluations.</p>}</Card></main><aside className="space-y-5"><Card title="LINKED ACCOUNT"><p>{referee.user ? `${referee.user.name} Â· ${referee.user.email} Â· ${referee.user.role}` : "Not linked"}</p></Card><Card title="OFFICIAL RANKING"><p>{referee.ranking ? `#${referee.ranking.position} Â· ${referee.ranking.rating} Â· ${referee.ranking.evaluation_count} evaluations` : `UNRANKED Â· ${referee.evaluation_count}/5 evaluations`}</p></Card></aside></div>
    {mode && <div role="dialog" aria-modal="true" aria-labelledby="referee-dialog-title" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-[#FFFFFF] p-5"><h2 id="referee-dialog-title" className="font-bold text-[#078052]">{mode === "link" ? "LINK REFEREE ACCOUNT" : mode === "evaluation" ? "ADD REFEREE EVALUATION" : `${isActive ? "DEACTIVATE" : "ACTIVATE"} REFEREE`}</h2>{notice && <p role="alert" className="mt-4 rounded border border-[#078052]/40 bg-[#078052]/10 p-3 text-sm text-[#078052]">{notice}</p>}{mode === "link" && <><div className="mt-4 space-y-2">{users.map((user) => <button type="button" key={user.user_id} onClick={() => setSelected(user)} className={`block w-full rounded p-3 text-left ${selected?.user_id === user.user_id ? "bg-[#078052]/15 ring-1 ring-[#078052]/50" : "bg-[#F8FAFC] hover:bg-slate-50"}`}>{user.name} Â· {user.email} Â· {user.role}</button>)}{!users.length && <p className="text-sm text-slate-600">No eligible active accounts found.</p>}</div><button type="button" disabled={!selected || isSubmitting} onClick={submitAccountLink} className="mt-5 rounded bg-[#078052] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "LINKINGâ€¦" : "LINK ACCOUNT"}</button></>}{mode === "evaluation" && <><div className="mt-4 space-y-2">{matches.map((match) => <button type="button" key={match.match_id} onClick={() => setSelected(match)} className={`block w-full rounded p-3 text-left ${selected?.match_id === match.match_id ? "bg-[#078052]/15 ring-1 ring-[#078052]/50" : "bg-[#F8FAFC] hover:bg-slate-50"}`}>{match.competition.name} Â· {match.home_team.name} {match.home_score}â€“{match.away_score} {match.away_team.name}</button>)}{!matches.length && <p className="text-sm text-slate-600">No matches are available for evaluation.</p>}</div><label className="mt-4 block text-sm font-medium">Score (1â€“10)<input min="1" max="10" step="0.1" type="number" value={score} onChange={(event) => setScore(event.target.value)} className="mt-2 w-full rounded border border-slate-200 bg-[#F8FAFC] p-3" /></label><button type="button" disabled={!selected || !score || isSubmitting} onClick={submitEvaluation} className="mt-4 rounded bg-[#078052] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "SAVINGâ€¦" : "SAVE EVALUATION"}</button></>}{mode === "lifecycle" && <><p className="mt-4 text-sm text-white/70">Are you sure you want to {isActive ? "deactivate" : "activate"} {referee.name}?</p><button type="button" disabled={isSubmitting} onClick={submitLifecycle} className="mt-5 rounded bg-[#078052] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "SAVINGâ€¦" : "CONFIRM"}</button></>}<button type="button" disabled={isSubmitting} onClick={closeDialog} className="ml-3 mt-5 rounded px-3 py-2 text-sm font-bold text-white/70 hover:text-white disabled:opacity-50">CANCEL</button></div></div>}
  </div>;
}
