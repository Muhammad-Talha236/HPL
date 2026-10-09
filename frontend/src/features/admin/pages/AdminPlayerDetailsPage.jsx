import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PlayerMembershipModal from "../components/PlayerMembershipModal";
import apiClient from "../../../services/apiClient";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");

const AdminPlayerDetailsPage = () => {
  const { playerId } = useParams();
  const [state, setState] = useState({ kind: "loading" });
  const [notice, setNotice] = useState("");
  const [membershipModalMode, setMembershipModalMode] = useState(null);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipBeingEnded, setMembershipBeingEnded] = useState(null);
  const [membershipActionPending, setMembershipActionPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);

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
    if (!window.confirm(`${action === "activate" ? "Activate" : "Deactivate"} “${state.player?.name || "this player"}”? Historical records remain preserved.`)) return;
    setStatusPending(true);
    setNotice("");
    try {
      await apiClient.patch(`/players/${playerId}/${action}`);
      setNotice(`Player ${action === "activate" ? "activated" : "deactivated"}.`);
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
    return <div className="p-5 text-white/60 sm:p-8">{state.kind === "missing" ? "Player not found." : state.kind === "error" ? "Player details could not be loaded." : "Loading player…"}</div>;
  }

  const player = state.player;
  const currentMemberships = player.team_players.filter((membership) => membership.status === "ACTIVE");
  const teamHistory = player.team_players.filter((membership) => membership.status !== "ACTIVE");

  return (
    <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
      <Link to="/admin/players" className="text-sm font-semibold text-[#EEC058] hover:text-[#ffad9f]">← PLAYERS</Link>
      {notice && <p role="status" className="mt-4 rounded-lg border border-[#EEC058]/30 bg-[#EEC058]/10 px-4 py-3 text-sm text-[#ffe0a1]">{notice}</p>}

      <header className="mt-5 flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0B1D2F] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-2xl font-bold text-[#ffad9f]">{player.name}</h1><p className="mt-1 text-sm text-white/55">{player.position || "—"} · {player.gender}</p><p className="mt-2 text-xs font-semibold text-[#EEC058]">{player.registration_number} · {player.status}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/players/${player.player_id}/edit`} className="rounded border border-white/20 px-3 py-2 text-xs font-bold text-white hover:border-[#EEC058]">EDIT PLAYER</Link>
          {player.status === "ACTIVE" && <button type="button" onClick={() => setMembershipModalMode("add")} className="rounded border border-[#EEC058]/60 px-3 py-2 text-xs font-bold text-[#EEC058] hover:bg-[#EEC058]/10">ADD TO TEAM</button>}
          <button type="button" disabled={statusPending} onClick={() => updatePlayerStatus(player.status === "ACTIVE" ? "deactivate" : "activate")} className="rounded border border-[#FF553D]/70 px-3 py-2 text-xs font-bold text-[#ffad9f] disabled:opacity-50">{statusPending ? "SAVING…" : player.status === "ACTIVE" ? "DEACTIVATE" : "ACTIVATE"}</button>
        </div>
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
        <main className="min-w-0">
          <ProfileContentManager player={player} onChanged={load} />
          <Card title="PLAYER INFORMATION"><p>{player.gender} · {player.position || "—"} · {player.nationality || "—"}</p><p className="mt-2">Born {formatDate(player.date_of_birth)}</p></Card>
          <Card title="CURRENT TEAM MEMBERSHIPS"><MembershipList memberships={currentMemberships} emptyMessage="No active team memberships." onEdit={(membership) => { setSelectedMembership(membership); setMembershipModalMode("edit"); }} onEnd={setMembershipBeingEnded} /></Card>
          <Card title="TEAM HISTORY"><MembershipList memberships={teamHistory} historical emptyMessage="No previous team memberships." /></Card>
        </main>
        <aside className="min-w-0"><Card title="REGISTRATION"><p>{player.registration_number}</p><p className="mt-2">{player.status}</p></Card><Card title="CONTACT"><p>{player.phone || "—"}</p></Card><Card title="SYSTEM INFORMATION"><p>Player #{player.player_id}</p><p className="mt-2">Created {formatDate(player.created_at)}</p></Card></aside>
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

  return <Card title="PROFILE CONTENT"><p className="text-xs text-white/50">Only HTTPS image URLs or local /uploads/ paths are accepted.</p>{error && <p className="mt-3 text-xs text-red-200">{error}</p>}<div className="mt-4 grid gap-5 lg:grid-cols-2"><form onSubmit={(event) => { event.preventDefault(); save("/achievements", { ...achievement, awarded_year: achievement.awarded_year ? Number(achievement.awarded_year) : null }, () => setAchievement({ title: "", achievement_type: "", awarded_year: "" })); }} className="space-y-2"><h3 className="text-xs font-bold text-white">ACHIEVEMENTS</h3><input required value={achievement.title} onChange={(event) => setAchievement({ ...achievement, title: event.target.value })} placeholder="Title" maxLength="160" className="w-full rounded border border-white/15 bg-[#07192a] p-2 text-sm" /><input required value={achievement.achievement_type} onChange={(event) => setAchievement({ ...achievement, achievement_type: event.target.value })} placeholder="Type (e.g. Top Scorer)" maxLength="60" className="w-full rounded border border-white/15 bg-[#07192a] p-2 text-sm" /><input value={achievement.awarded_year} onChange={(event) => setAchievement({ ...achievement, awarded_year: event.target.value })} placeholder="Year (optional)" min="1900" max="2100" type="number" className="w-full rounded border border-white/15 bg-[#07192a] p-2 text-sm" /><button disabled={busy} className="rounded border border-[#EEC058]/60 px-3 py-2 text-xs font-bold text-[#EEC058] disabled:opacity-50">ADD ACHIEVEMENT</button><div className="space-y-1">{player.achievements.map((item) => <div key={item.achievement_id} className="flex items-center justify-between gap-2 rounded bg-[#07192a] p-2 text-xs"><span>{item.title}{item.awarded_year ? ` · ${item.awarded_year}` : ""}</span><button type="button" disabled={busy} onClick={() => remove(`/achievements/${item.achievement_id}`, "achievement")} className="text-[#ffad9f]">REMOVE</button></div>)}</div></form><form onSubmit={(event) => { event.preventDefault(); save("/gallery", photo, () => setPhoto({ image_url: "", caption: "" })); }} className="space-y-2"><h3 className="text-xs font-bold text-white">PHOTO GALLERY</h3><input required value={photo.image_url} onChange={(event) => setPhoto({ ...photo, image_url: event.target.value })} placeholder="HTTPS image URL or /uploads/ path" maxLength="500" className="w-full rounded border border-white/15 bg-[#07192a] p-2 text-sm" /><input value={photo.caption} onChange={(event) => setPhoto({ ...photo, caption: event.target.value })} placeholder="Caption (optional)" maxLength="240" className="w-full rounded border border-white/15 bg-[#07192a] p-2 text-sm" /><button disabled={busy} className="rounded border border-[#EEC058]/60 px-3 py-2 text-xs font-bold text-[#EEC058] disabled:opacity-50">ADD PHOTO</button><div className="space-y-1">{player.gallery_photos.map((item) => <div key={item.photo_id} className="flex items-center justify-between gap-2 rounded bg-[#07192a] p-2 text-xs"><span className="truncate">{item.caption || item.image_url}</span><button type="button" disabled={busy} onClick={() => remove(`/gallery/${item.photo_id}`, "photo")} className="shrink-0 text-[#ffad9f]">REMOVE</button></div>)}</div></form></div></Card>;
};

const MembershipList = ({ memberships, emptyMessage, historical = false, onEdit, onEnd }) => {
  if (!memberships.length) return <p className="text-sm text-white/55">{emptyMessage}</p>;
  return <div className="space-y-3">{memberships.map((membership) => <article key={membership.team_player_id} className="rounded-lg border border-white/10 bg-[#07192a] p-3"><div className="grid gap-2 text-sm sm:grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_5rem_7rem_7rem_auto] sm:items-center"><Link to={`/admin/teams/${membership.team.team_id}`} className="font-bold text-[#ffad9f] hover:text-white">{membership.team.name}</Link><span className="text-white/60">{membership.team.club?.name || "—"}</span><span>#{membership.jersey_number ?? "—"}</span><span>{formatDate(membership.joined_at)}</span><span className={membership.status === "ACTIVE" ? "text-emerald-300" : "text-white/55"}>{membership.status}</span>{!historical && <details className="relative sm:justify-self-end"><summary className="cursor-pointer list-none rounded border border-white/20 px-2 py-1 text-center text-lg leading-none text-white/75 hover:border-[#EEC058]" aria-label={`Membership actions for ${membership.team.name}`}>⋯</summary><div className="right-0 z-10 mt-1 flex w-40 flex-col overflow-hidden rounded border border-white/15 bg-[#10283e] shadow-xl sm:absolute"><button type="button" onClick={() => onEdit(membership)} className="px-3 py-2 text-left text-xs font-bold text-white hover:bg-white/10">EDIT MEMBERSHIP</button><button type="button" onClick={() => onEnd(membership)} className="border-t border-white/10 px-3 py-2 text-left text-xs font-bold text-[#ffad9f] hover:bg-[#FF553D]/10">END MEMBERSHIP</button></div></details>}</div>{historical && <p className="mt-2 text-xs text-white/50">Left {formatDate(membership.left_at)}</p>}</article>)}</div>;
};

const EndMembershipDialog = ({ player, membership, busy, onCancel, onConfirm }) => <div role="dialog" aria-modal="true" aria-labelledby="end-membership-title" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="w-full max-w-md rounded-xl border border-[#FF553D]/40 bg-[#0B1D2F] p-5 shadow-2xl"><h2 id="end-membership-title" className="font-bold text-[#ffad9f]">END TEAM MEMBERSHIP</h2><p className="mt-3 text-sm leading-6 text-white/70">End {player.name}'s membership with {membership.team.name}? The membership history and historical match records will remain preserved.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={onCancel} className="px-3 py-2 text-xs font-bold text-white/65 disabled:opacity-50">CANCEL</button><button type="button" disabled={busy} onClick={onConfirm} className="rounded bg-[#FF553D] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "ENDING…" : "END MEMBERSHIP"}</button></div></div></div>;
const Card = ({ title, children }) => <section className="mb-5 rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><h2 className="text-sm font-bold text-[#EEC058]">{title}</h2><div className="mt-4 text-sm text-white/65">{children}</div></section>;

export default AdminPlayerDetailsPage;
