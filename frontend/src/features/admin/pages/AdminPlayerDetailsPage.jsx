import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PlayerMembershipModal from "../components/PlayerMembershipModal";
import apiClient from "../../../services/apiClient";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "â€”");

const AdminPlayerDetailsPage = () => {
  const { playerId } = useParams();
  const [state, setState] = useState({ kind: "loading" });
  const [notice, setNotice] = useState("");
  const [membershipModalMode, setMembershipModalMode] = useState(null);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipBeingEnded, setMembershipBeingEnded] = useState(null);
  const [membershipActionPending, setMembershipActionPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    try {
      const response = await apiClient.get(`/admin/players/${playerId}`);
      setState({ kind: "ready", player: response.data.data });
    } catch (error) {
      setState({ kind: error.response?.status === 404 ? "missing" : "error" });
    }
  }, [playerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const closeMembershipModal = () => {
    setMembershipModalMode(null);
    setSelectedMembership(null);
  };

  const handleMembershipSaved = async (message) => {
    closeMembershipModal();
    setNotice(message);
    await load();
  };

  const updatePlayerStatus = async (action) => {
    const isReinstate = action === "reinstate";
    if (!window.confirm(`${isReinstate ? "Reinstate" : "Suspend"} â€œ${state.player?.name || "this player"}â€? Historical records remain preserved.`)) return;
    const reason = !isReinstate ? window.prompt("Suspension reason (at least 5 characters)") : window.prompt("Optional reinstatement note") || "";
    if (!isReinstate && (!reason || reason.trim().length < 5)) return;
    setStatusPending(true);
    setNotice("");
    try {
      await apiClient.patch(`/admin/players/${playerId}/${isReinstate ? "reinstate" : "suspend"}`, { reason: reason?.trim() || undefined });
      setNotice(`Player ${isReinstate ? "reinstated" : "suspended"}.`);
      await load();
    } catch (error) {
      setNotice(error.response?.data?.message || "Player status could not be changed.");
    } finally {
      setStatusPending(false);
    }
  };

  const endMembership = async () => {
    if (!membershipBeingEnded || membershipActionPending) return;
    setMembershipActionPending(true);
    setNotice("");
    try {
      await apiClient.patch(`/team-players/${membershipBeingEnded.team_player_id}/remove`);
      setMembershipBeingEnded(null);
      setNotice("Team membership ended. Historical records have been preserved.");
      await load();
    } catch (error) {
      setNotice(error.response?.data?.message || "Team membership could not be ended.");
    } finally {
      setMembershipActionPending(false);
    }
  };

  if (state.kind !== "ready") {
    return <div className="mx-auto w-full max-w-[1440px] p-5 text-slate-500 sm:p-8">{state.kind === "missing" ? "Player not found." : state.kind === "error" ? "Player details could not be loaded." : "Loading playerâ€¦"}</div>;
  }

  const player = state.player;
  const currentMemberships = player.team_players.filter((membership) => membership.status === "ACTIVE");
  const teamHistory = player.team_players.filter((membership) => membership.status !== "ACTIVE");

  return (
    <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-6 lg:p-8">
      <Link to="/admin/players" className="text-xs font-semibold text-[#078052] hover:underline">â† Players</Link>
      {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

      <header className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-[26px] font-extrabold tracking-tight text-[#10213F]">{player.name}</h1><p className="mt-1 text-sm text-slate-500">{player.position || "â€”"} Â· {player.gender}</p><p className="mt-2 text-xs font-semibold text-[#078052]">{player.registration_number} Â· {player.status === "INACTIVE" ? "Suspended" : "Active"}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/players/${player.player_id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Edit Player</Link>
          {player.status === "ACTIVE" && <button type="button" onClick={() => setMembershipModalMode("add")} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-[#078052] hover:bg-emerald-50">Add to Team</button>}
          <button type="button" disabled={statusPending} onClick={() => updatePlayerStatus(player.status === "ACTIVE" ? "suspend" : "reinstate")} className="rounded-lg bg-[#078052] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{statusPending ? "Savingâ€¦" : player.status === "ACTIVE" ? "Suspend" : "Reinstate"}</button>
        </div>
      </header>

      <div className="mt-6 grid gap-5 xl:grid-cols-[2fr_1fr]">
        <main className="min-w-0">
          <nav className="mb-4 flex flex-wrap gap-2 border-b border-slate-200">{[["overview","Overview"],["team","Team History"],["stats","Match Statistics"],["admin","Administrative History"]].map(([key,label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`border-b-2 px-3 py-2 text-xs font-semibold ${tab === key ? "border-[#078052] text-[#078052]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{label}</button>)}</nav>
          {tab === "stats" && <Card title="MATCH STATISTICS"><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{Object.entries(player.statistics || {}).map(([key,value]) => <div key={key} className="rounded bg-slate-50 p-3"><p className="text-xs text-slate-500">{key.replaceAll("_"," ")}</p><p className="mt-1 text-lg font-bold">{value ?? "Not tracked"}</p></div>)}</div></Card>}
          {tab === "admin" && <Card title="ADMINISTRATIVE HISTORY"><div className="space-y-2">{(player.administrative_history || []).map((entry) => <p key={entry.audit_id} className="border-b border-slate-200 pb-2 text-sm">{entry.action} Â· {entry.actor?.name || "System"} Â· {formatDate(entry.created_at)}{entry.details?.reason ? ` Â· ${entry.details.reason}` : ""}</p>)}{!player.administrative_history?.length && <p>No administrative history.</p>}</div></Card>}
          <ProfileContentManager player={player} onChanged={load} />
          <Card title="PLAYER INFORMATION"><p>{player.gender} Â· {player.position || "â€”"} Â· {player.nationality || "â€”"}</p><p className="mt-2">Born {formatDate(player.date_of_birth)}</p></Card>
          <Card title="CURRENT TEAM MEMBERSHIPS"><MembershipList memberships={currentMemberships} emptyMessage="No active team memberships." onEdit={(membership) => { setSelectedMembership(membership); setMembershipModalMode("edit"); }} onEnd={setMembershipBeingEnded} /></Card>
          {tab !== "stats" && tab !== "admin" && <Card title="TEAM HISTORY"><MembershipList memberships={teamHistory} historical emptyMessage="No previous team memberships." /></Card>}
        </main>
        <aside className="min-w-0"><Card title="REGISTRATION"><p>{player.registration_number}</p><p className="mt-2">{player.status}</p></Card><Card title="CONTACT"><p>{player.phone || "â€”"}</p></Card><Card title="SYSTEM INFORMATION"><p>Player #{player.player_id}</p><p className="mt-2">Created {formatDate(player.created_at)}</p></Card></aside>
      </div>

      {membershipModalMode && <PlayerMembershipModal player={player} membership={membershipModalMode === "edit" ? selectedMembership : null} onClose={closeMembershipModal} onSaved={handleMembershipSaved} />}
      {membershipBeingEnded && <EndMembershipDialog player={player} membership={membershipBeingEnded} busy={membershipActionPending} onCancel={() => !membershipActionPending && setMembershipBeingEnded(null)} onConfirm={endMembership} />}
    </div>
  );
};

const ProfileContentManager = ({ player, onChanged }) => {
  const [achievement, setAchievement] = useState({ title: "", achievement_type: "", awarded_year: "" });
  const [photo, setPhoto] = useState({ image_url: "", caption: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (path, payload, reset) => {
    setBusy(true); setError("");
    try { await apiClient.post(`/players/${player.player_id}${path}`, payload); reset(); await onChanged(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Profile content could not be saved."); }
    finally { setBusy(false); }
  };
  const remove = async (path, label) => {
    if (!window.confirm(`Remove this ${label}?`)) return;
    setBusy(true); setError("");
    try { await apiClient.delete(`/players/${player.player_id}${path}`); await onChanged(); }
    catch (requestError) { setError(requestError.response?.data?.message || `The ${label} could not be removed.`); }
    finally { setBusy(false); }
  };

  return <Card title="PROFILE CONTENT"><p className="text-xs text-slate-500">Only HTTPS image URLs or local /uploads/ paths are accepted.</p>{error && <p className="mt-3 text-xs text-red-200">{error}</p>}<div className="mt-4 grid gap-5 lg:grid-cols-2"><form onSubmit={(event) => { event.preventDefault(); save("/achievements", { ...achievement, awarded_year: achievement.awarded_year ? Number(achievement.awarded_year) : null }, () => setAchievement({ title: "", achievement_type: "", awarded_year: "" })); }} className="space-y-2"><h3 className="text-xs font-bold text-[#10213F]">ACHIEVEMENTS</h3><input required value={achievement.title} onChange={(event) => setAchievement({ ...achievement, title: event.target.value })} placeholder="Title" maxLength="160" className="w-full rounded border border-slate-200 bg-[#F8FAFC] p-2 text-sm" /><input required value={achievement.achievement_type} onChange={(event) => setAchievement({ ...achievement, achievement_type: event.target.value })} placeholder="Type (e.g. Top Scorer)" maxLength="60" className="w-full rounded border border-slate-200 bg-[#F8FAFC] p-2 text-sm" /><input value={achievement.awarded_year} onChange={(event) => setAchievement({ ...achievement, awarded_year: event.target.value })} placeholder="Year (optional)" min="1900" max="2100" type="number" className="w-full rounded border border-slate-200 bg-[#F8FAFC] p-2 text-sm" /><button disabled={busy} className="rounded border border-[#078052]/60 px-3 py-2 text-xs font-bold text-[#078052] disabled:opacity-50">ADD ACHIEVEMENT</button><div className="space-y-1">{player.achievements.map((item) => <div key={item.achievement_id} className="flex items-center justify-between gap-2 rounded bg-[#F8FAFC] p-2 text-xs"><span>{item.title}{item.awarded_year ? ` Â· ${item.awarded_year}` : ""}</span><button type="button" disabled={busy} onClick={() => remove(`/achievements/${item.achievement_id}`, "achievement")} className="text-[#078052]">REMOVE</button></div>)}</div></form><form onSubmit={(event) => { event.preventDefault(); save("/gallery", photo, () => setPhoto({ image_url: "", caption: "" })); }} className="space-y-2"><h3 className="text-xs font-bold text-[#10213F]">PHOTO GALLERY</h3><input required value={photo.image_url} onChange={(event) => setPhoto({ ...photo, image_url: event.target.value })} placeholder="HTTPS image URL or /uploads/ path" maxLength="500" className="w-full rounded border border-slate-200 bg-[#F8FAFC] p-2 text-sm" /><input value={photo.caption} onChange={(event) => setPhoto({ ...photo, caption: event.target.value })} placeholder="Caption (optional)" maxLength="240" className="w-full rounded border border-slate-200 bg-[#F8FAFC] p-2 text-sm" /><button disabled={busy} className="rounded border border-[#078052]/60 px-3 py-2 text-xs font-bold text-[#078052] disabled:opacity-50">ADD PHOTO</button><div className="space-y-1">{player.gallery_photos.map((item) => <div key={item.photo_id} className="flex items-center justify-between gap-2 rounded bg-[#F8FAFC] p-2 text-xs"><span className="truncate">{item.caption || item.image_url}</span><button type="button" disabled={busy} onClick={() => remove(`/gallery/${item.photo_id}`, "photo")} className="shrink-0 text-[#078052]">REMOVE</button></div>)}</div></form></div></Card>;
};

const MembershipList = ({ memberships, emptyMessage, historical = false, onEdit, onEnd }) => {
  if (!memberships.length) return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  return <div className="space-y-3">{memberships.map((membership) => <article key={membership.team_player_id} className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-3"><div className="grid gap-2 text-sm sm:grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_5rem_7rem_7rem_auto] sm:items-center"><Link to={`/admin/teams/${membership.team.team_id}`} className="font-bold text-[#078052] hover:text-white">{membership.team.name}</Link><span className="text-slate-600">{membership.team.club?.name || "â€”"}</span><span>#{membership.jersey_number ?? "â€”"}</span><span>{formatDate(membership.joined_at)}</span><span className={membership.status === "ACTIVE" ? "text-emerald-300" : "text-slate-500"}>{membership.status}</span>{!historical && <details className="relative sm:justify-self-end"><summary className="cursor-pointer list-none rounded border border-slate-200 px-2 py-1 text-center text-lg leading-none text-white/75 hover:border-[#078052]" aria-label={`Membership actions for ${membership.team.name}`}>â‹¯</summary><div className="right-0 z-10 mt-1 flex w-40 flex-col overflow-hidden rounded border border-slate-200 bg-[#FFFFFF] shadow-xl sm:absolute"><button type="button" onClick={() => onEdit(membership)} className="px-3 py-2 text-left text-xs font-bold text-white hover:bg-slate-100">EDIT MEMBERSHIP</button><button type="button" onClick={() => onEnd(membership)} className="border-t border-slate-200 px-3 py-2 text-left text-xs font-bold text-[#078052] hover:bg-[#078052]/10">END MEMBERSHIP</button></div></details>}</div>{historical && <p className="mt-2 text-xs text-slate-500">Left {formatDate(membership.left_at)}</p>}</article>)}</div>;
};

const EndMembershipDialog = ({ player, membership, busy, onCancel, onConfirm }) => <div role="dialog" aria-modal="true" aria-labelledby="end-membership-title" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="w-full max-w-md rounded-xl border border-[#078052]/40 bg-[#FFFFFF] p-5 shadow-2xl"><h2 id="end-membership-title" className="font-bold text-[#078052]">END TEAM MEMBERSHIP</h2><p className="mt-3 text-sm leading-6 text-white/70">End {player.name}'s membership with {membership.team.name}? The membership history and historical match records will remain preserved.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={onCancel} className="px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">CANCEL</button><button type="button" disabled={busy} onClick={onConfirm} className="rounded bg-[#078052] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "ENDINGâ€¦" : "END MEMBERSHIP"}</button></div></div></div>;
const Card = ({ title, children }) => <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#10213F]">{title}</h2><div className="mt-4 text-sm text-slate-600">{children}</div></section>;

export default AdminPlayerDetailsPage;
