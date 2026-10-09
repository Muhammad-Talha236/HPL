import { useEffect, useState } from "react";
import apiClient from "../../../services/apiClient";
import { FEATURES } from "../../../constants/features";

const PlayerMembershipModal = ({ player, membership, onClose, onSaved }) => {
  const isAdding = !membership;
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [jerseyNumber, setJerseyNumber] = useState(membership?.jersey_number || "");
  const [joinedAt, setJoinedAt] = useState(membership?.joined_at?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const gender = player.gender === "MALE" ? "MEN" : "WOMEN";

  useEffect(() => {
    if (!isAdding) return undefined;
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get("/admin/teams", { params: { q: query, gender, status: "ACTIVE", page: 1, limit: 20 } });
        setTeams((response.data.data || []).map(({ club, ...team }) => FEATURES.CLUBS_ENABLED ? { ...team, club } : team));
      } catch {
        setTeams([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [gender, isAdding, query]);

  const submit = async (event) => {
    event.preventDefault();
    if (saving || (isAdding && !selectedTeam)) return;
    setSaving(true);
    setError("");
    try {
      const jersey = jerseyNumber === "" ? null : Number(jerseyNumber);
      if (isAdding) {
        await apiClient.post("/team-players", { team_id: selectedTeam.team_id, player_id: player.player_id, jersey_number: jersey, joined_at: joinedAt });
      } else {
        await apiClient.patch(`/team-players/${membership.team_player_id}`, { jersey_number: jersey });
      }
      onSaved(isAdding ? "Player added to team." : "Membership updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Membership could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="membership-modal-title" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form onSubmit={submit} className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-white/15 bg-[#0B1D2F] p-5 shadow-2xl">
        <h2 id="membership-modal-title" className="font-bold text-[#ffad9f]">{isAdding ? "ADD PLAYER TO TEAM" : "EDIT TEAM MEMBERSHIP"}</h2>
        <p className="mt-2 text-sm text-white/60">{player.name} · {player.position || "—"}</p>

        {isAdding ? <>
          <label className="mt-5 block text-xs font-bold text-white/60">COMPATIBLE ACTIVE TEAM
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search compatible teams…" className="mt-2 w-full rounded border border-white/15 bg-[#07192a] p-3 text-sm" />
          </label>
          <div className="mt-2 max-h-40 overflow-y-auto rounded border border-white/10">
            {teams.map((team) => <button type="button" key={team.team_id} onClick={() => setSelectedTeam(team)} className={`block w-full p-3 text-left text-sm ${selectedTeam?.team_id === team.team_id ? "bg-[#EEC058]/15" : "hover:bg-white/5"}`}><b>{team.name}</b>{FEATURES.CLUBS_ENABLED && team.club?.name ? ` · ${team.club.name}` : ""} · {team.gender}</button>)}
            {!teams.length && <p className="p-3 text-sm text-white/50">No compatible active teams found.</p>}
          </div>
        </> : <div className="mt-5 rounded bg-[#07192a] p-3 text-sm"><b>{membership.team.name}</b><span className="ml-2 text-white/55">Team and player cannot be changed.</span></div>}

        <label className="mt-4 block text-xs font-bold text-white/60">JERSEY NUMBER
          <input min="1" max="99" type="number" inputMode="numeric" value={jerseyNumber} onChange={(event) => setJerseyNumber(event.target.value)} className="mt-2 w-full rounded border border-white/15 bg-[#07192a] p-3 text-sm" />
        </label>
        {isAdding && <label className="mt-4 block text-xs font-bold text-white/60">JOINED DATE<input required type="date" value={joinedAt} onChange={(event) => setJoinedAt(event.target.value)} className="mt-2 w-full rounded border border-white/15 bg-[#07192a] p-3 text-sm" /></label>}
        {error && <p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
        <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="text-xs font-bold text-white/60 disabled:opacity-50">CANCEL</button><button disabled={saving || (isAdding && !selectedTeam)} className="rounded bg-[#FF553D] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? "SAVING…" : "SAVE"}</button></div>
      </form>
    </div>
  );
};

export default PlayerMembershipModal;
