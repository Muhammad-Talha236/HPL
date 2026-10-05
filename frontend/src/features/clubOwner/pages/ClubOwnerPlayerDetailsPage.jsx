import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import PlayerInvitationManager from "../../playerInvitations/components/PlayerInvitationManager";

const today = new Date().toISOString().slice(0, 10);

export default function ClubOwnerPlayerDetailsPage() {
  const { playerId } = useParams();
  const [state, setState] = useState({ status: "loading" });
  const [dialog, setDialog] = useState("");
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await apiClient.get(`/club-owner/players/${playerId}`);
      setState({ status: "success", data: response.data.data });
    } catch (error) {
      setState({ status: "error", message: error.response?.data?.message || "Player unavailable." });
    }
  }, [playerId]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const openAdd = async () => {
    setNotice("");
    try {
      const gender = state.data.player.gender === "MALE" ? "MEN" : state.data.player.gender === "FEMALE" ? "WOMEN" : "";
      const response = await apiClient.get("/club-owner/teams", { params: { gender, status: "ACTIVE", limit: 50 } });
      setTeams(response.data.data || []);
      setDialog("add");
    } catch { setNotice("Unable to load eligible club teams."); }
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setNotice("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (dialog === "add") await apiClient.post("/team-players", { team_id: Number(values.team_id), player_id: state.data.player.player_id, jersey_number: values.jersey_number ? Number(values.jersey_number) : null, joined_at: values.joined_at });
      if (dialog === "edit") await apiClient.patch(`/team-players/${state.data.team_player_id}`, { jersey_number: values.jersey_number ? Number(values.jersey_number) : null });
      if (dialog === "end") await apiClient.patch(`/team-players/${state.data.team_player_id}/remove`, {});
      setDialog(""); await load();
    } catch (error) { setNotice(error.response?.data?.message || "Membership update failed."); }
    finally { setSaving(false); }
  };
  if (state.status === "loading") return <div className="p-8 text-slate-500" role="status">Loading player…</div>;
  if (state.status === "error") return <div className="p-8"><p role="alert" className="text-red-700">{state.message}</p><button type="button" onClick={load} className="mt-3 rounded border border-[#d94d3d] px-3 py-2 text-xs font-bold text-[#b83729]">RETRY</button></div>;
  const membership = state.data;
  const player = membership.player;
  return <div className="mx-auto max-w-5xl p-5 sm:p-8">
    <Link to="/club/players" className="text-xs font-bold text-[#b83729]">← BACK TO PLAYERS</Link>
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap justify-between gap-4"><div className="flex gap-4">{player.profile_photo ? <img src={player.profile_photo} alt={`${player.name} profile`} className="h-20 w-20 rounded-full object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-xl font-extrabold text-slate-600">{player.name.slice(0, 1)}</div>}<div><p className="text-xs font-extrabold tracking-[.14em] text-[#b83729]">PLAYER DETAILS</p><h1 className="mt-1 text-3xl font-extrabold text-slate-900">{player.name}</h1><p className="mt-1 text-sm text-slate-500">{player.registration_number} · {player.gender} · {player.position || "Position not recorded"}</p></div></div><button type="button" onClick={openAdd} className="h-fit rounded bg-[#d94d3d] px-4 py-2 text-xs font-extrabold text-white">ADD TO TEAM</button></div>
      <div className="mt-6 rounded-lg border border-slate-100 p-4"><p className="text-xs font-extrabold text-slate-500">CURRENT CLUB MEMBERSHIP</p><p className="mt-2 font-bold text-slate-900">{membership.team.name} <span className="font-normal text-slate-500">· Jersey #{membership.jersey_number ?? "—"}</span></p><p className="mt-1 text-sm text-slate-500">Joined {new Date(membership.joined_at).toLocaleDateString()} · ACTIVE</p><div className="mt-4 flex gap-3"><button type="button" onClick={() => { setNotice(""); setDialog("edit"); }} className="text-xs font-extrabold text-slate-700">EDIT MEMBERSHIP</button><button type="button" onClick={() => { setNotice(""); setDialog("end"); }} className="text-xs font-extrabold text-red-700">END MEMBERSHIP</button></div></div>
    </section>
    <PlayerInvitationManager player={player} teams={membership.eligible_invitation_teams || []} />
    {notice && <p role="alert" className="mt-4 text-sm text-red-700">{notice}</p>}
    {dialog && <div role="dialog" aria-modal="true" aria-labelledby="membership-title" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form onSubmit={submit} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5"><h2 id="membership-title" className="text-lg font-extrabold text-slate-900">{dialog === "add" ? "ADD TO TEAM" : dialog === "edit" ? "EDIT MEMBERSHIP" : "END MEMBERSHIP"}</h2>{dialog === "add" && <><label className="mt-4 block text-xs font-bold text-slate-600">Club team<select name="team_id" required className="mt-1 w-full rounded border border-slate-300 p-2.5 text-sm">{teams.map((team) => <option key={team.team_id} value={team.team_id}>{team.name}</option>)}</select></label><label className="mt-3 block text-xs font-bold text-slate-600">Jersey number<input name="jersey_number" min="1" max="99" type="number" className="mt-1 w-full rounded border border-slate-300 p-2.5" /></label><label className="mt-3 block text-xs font-bold text-slate-600">Joined date<input name="joined_at" defaultValue={today} required type="date" className="mt-1 w-full rounded border border-slate-300 p-2.5" /></label></>}{dialog === "edit" && <label className="mt-4 block text-xs font-bold text-slate-600">Jersey number<input name="jersey_number" defaultValue={membership.jersey_number || ""} min="1" max="99" type="number" className="mt-1 w-full rounded border border-slate-300 p-2.5" /></label>}{dialog === "end" && <p className="mt-4 text-sm text-slate-600">End {player.name}'s membership with {membership.team.name}? The history will be preserved.</p>}{notice && <p role="alert" className="mt-3 text-sm text-red-700">{notice}</p>}<div className="mt-5 flex gap-3"><button disabled={saving} className="rounded bg-[#d94d3d] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{saving ? "SAVING…" : dialog === "end" ? "END MEMBERSHIP" : "SAVE"}</button><button type="button" disabled={saving} onClick={() => setDialog("")} className="rounded border border-slate-300 px-4 py-2 text-xs font-extrabold text-slate-700">CANCEL</button></div></form></div>}
  </div>;
}
