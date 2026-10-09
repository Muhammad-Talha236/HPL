import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import apiClient from "../../../services/apiClient";

const Card = ({ title, children }) => <section className="mb-5 rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><h2 className="text-sm font-bold tracking-[.12em] text-[#EEC058]">{title}</h2><div className="mt-4">{children}</div></section>;
const Rows = ({ values, empty }) => values.length ? <div className="grid gap-2">{values.map((value) => <p key={value} className="rounded border border-white/10 bg-[#07192a] p-3 text-sm">{value}</p>)}</div> : <p className="text-sm text-white/55">{empty}</p>;

const AdminTeamDetailsPage = () => {
  const { teamId } = useParams();
  const [state, setState] = useState({ kind: "loading", data: null });
  const [notice, setNotice] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [owners, setOwners] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading", data: null });
    try {
      const response = await apiClient.get(`/admin/teams/${teamId}`);
      setState({ kind: "success", data: response.data.data });
    } catch (error) {
      setState({ kind: error.response?.status === 404 ? "not-found" : "error", data: null });
    }
  }, [teamId]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!transferOpen) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient.get("/users", { params: { q: query, role: "TEAM_OWNER", status: "ACTIVE", page: 1, limit: 20 } });
        setOwners(response.data.data || []);
      } catch {
        setOwners([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, transferOpen]);

  const changeStatus = async (action) => {
    if (!window.confirm(`${action === "deactivate" ? "Deactivate" : "Activate"} this team?`)) return;
    setPending(true);
    try {
      await apiClient.patch(`/teams/${teamId}/${action}`);
      setNotice(`Team ${action}d successfully.`);
      await load();
    } catch (error) {
      setNotice(error.response?.data?.message || "Action could not be completed.");
    } finally {
      setPending(false);
    }
  };

  const transferOwnership = async (event) => {
    event.preventDefault();
    if (!selectedOwner) return;
    setPending(true);
    try {
      await apiClient.patch(`/teams/${teamId}/owner`, { owner_id: selectedOwner.user_id });
      setTransferOpen(false);
      setNotice("Team ownership transferred successfully.");
      await load();
    } catch (error) {
      setNotice(error.response?.data?.message || "Ownership transfer could not be completed.");
    } finally {
      setPending(false);
    }
  };

  if (state.kind === "loading") return <div className="p-8 text-sm text-white/55">Loading team details…</div>;
  if (state.kind === "not-found") return <div className="p-8"><h1 className="text-xl font-bold">Team not found</h1><Link to="/admin/teams" className="mt-4 inline-block text-sm font-bold text-[#EEC058]">← BACK TO TEAMS</Link></div>;
  if (state.kind === "error") return <div className="p-8 text-sm text-red-200">Unable to load team details. <button type="button" onClick={load} className="font-bold underline">RETRY</button></div>;

  const team = state.data;
  const matches = [...team.home_matches.map((match) => ({ ...match, opponent: match.away_team.name })), ...team.away_matches.map((match) => ({ ...match, opponent: match.home_team.name }))];

  return <div className="p-5 sm:p-8">
    <nav className="text-sm text-white/55"><Link to="/admin/teams" className="hover:text-[#EEC058]">Teams</Link><span className="mx-2">→</span>{team.name}</nav>
    {notice && <p className="mt-4 rounded border border-[#EEC058]/30 bg-[#EEC058]/10 p-3 text-sm text-[#f4d383]">{notice}</p>}
    <header className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[#07192a] font-bold text-[#EEC058]">{team.logo ? <img src={team.logo} alt="" className="h-full w-full object-cover" /> : team.name.slice(0, 2).toUpperCase()}</div><div><h1 className="text-2xl font-bold text-[#ffad9f]">{team.name}</h1><p className="text-sm text-white/55">{team.gender} · {team.team_type}</p><span className="mt-2 inline-block rounded-full border border-[#EEC058]/35 px-2 py-1 text-xs font-bold text-[#EEC058]">{team.status}</span></div></div><div className="flex flex-wrap gap-2"><Link to={`/admin/teams/${teamId}/edit`} className="rounded border border-white/20 px-3 py-2 text-xs font-bold hover:border-[#EEC058]">EDIT TEAM</Link><button type="button" onClick={() => { setQuery(""); setSelectedOwner(null); setTransferOpen(true); }} className="rounded border border-[#EEC058]/60 px-3 py-2 text-xs font-bold text-[#EEC058]">TRANSFER OWNERSHIP</button><button type="button" disabled={pending} onClick={() => changeStatus(team.status === "ACTIVE" ? "deactivate" : "activate")} className="rounded border border-[#EEC058]/60 px-3 py-2 text-xs font-bold text-[#EEC058]">{team.status === "ACTIVE" ? "DEACTIVATE TEAM" : "ACTIVATE TEAM"}</button></div></header>
    <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]"><main><Card title="TEAM INFORMATION"><dl className="grid gap-4 text-sm sm:grid-cols-2">{Object.entries({ Gender: team.gender, Type: team.team_type, Location: [team.city, team.district, team.region].filter(Boolean).join(", ") || "—", "Contact email": team.contact_email || "—", "Contact phone": team.contact_phone || "—" }).map(([label, value]) => <div key={label}><dt className="text-white/45">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>{team.description && <p className="mt-4 text-sm text-white/60">{team.description}</p>}</Card><Card title={`ACTIVE SQUAD (${team.player_count})`}><Rows values={team.team_players.map((item) => `${item.player.name} · ${item.player.position || "Position not set"} · Jersey ${item.jersey_number ?? "—"}`)} empty="No active squad members." /></Card><Card title="COMPETITION PARTICIPATION"><Rows values={team.registrations.map((registration) => `${registration.competition.name} · ${registration.competition.season.name} · ${registration.registration_status}`)} empty="No competition registrations." /></Card><Card title="RECENT MATCHES"><Rows values={matches.map((match) => `${match.opponent} · ${match.status} · ${new Date(match.match_date).toLocaleDateString()}`)} empty="No recent matches." /></Card></main><aside><Card title="OWNER"><p className="font-bold">{team.owner.name}</p><p className="text-sm text-white/55">{team.owner.email}</p><p className="mt-2 text-xs text-[#EEC058]">{team.owner.role} · {team.owner.status}</p></Card><Card title="VENUE"><p>{team.home_venue?.name || "—"}</p><p className="text-sm text-white/55">{team.home_venue?.city || ""}</p></Card><Card title="SYSTEM INFORMATION"><p className="text-sm text-white/55">Team #{team.team_id}</p><p className="mt-2 text-sm text-white/55">Created {new Date(team.created_at).toLocaleDateString()}</p><p className="mt-2 text-sm text-white/55">Updated {new Date(team.updated_at).toLocaleDateString()}</p></Card></aside></div>
    {transferOpen && <div role="dialog" aria-modal="true" aria-label="Transfer team ownership" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><form onSubmit={transferOwnership} className="w-full max-w-lg rounded-xl border border-white/15 bg-[#0B1D2F] p-5 shadow-2xl"><h2 className="text-lg font-bold text-[#ffad9f]">TRANSFER TEAM OWNERSHIP</h2><p className="mt-2 text-sm text-white/60">Assign this team to another eligible Team Owner.</p><label className="mt-5 block text-xs font-bold text-white/60">NEW OWNER<input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelectedOwner(null); }} placeholder="Search eligible team owners…" className="mt-2 w-full rounded border border-white/15 bg-[#07192a] p-3 text-sm outline-none focus:border-[#EEC058]" /></label><div className="mt-2 max-h-40 overflow-y-auto rounded border border-white/10">{owners.filter((owner) => owner.user_id !== team.owner.user_id).map((owner) => <button type="button" key={owner.user_id} onClick={() => setSelectedOwner(owner)} className={`block w-full border-b border-white/10 p-3 text-left text-sm last:border-0 ${selectedOwner?.user_id === owner.user_id ? "bg-[#EEC058]/15" : "hover:bg-white/5"}`}><b>{owner.name}</b><span className="ml-2 text-white/55">{owner.email}</span></button>)}</div><div className="mt-5 flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => setTransferOpen(false)} className="px-3 py-2 text-xs font-bold text-white/60">CANCEL</button><button disabled={pending || !selectedOwner} className="rounded bg-[#FF553D] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{pending ? "TRANSFERRING…" : "TRANSFER OWNERSHIP"}</button></div></form></div>}
  </div>;
};

export default AdminTeamDetailsPage;
