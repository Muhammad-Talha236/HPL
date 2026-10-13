import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";

import {
  teamPlayersAdminApi,
  getTeamPlayerError,
} from "../services/teamPlayersAdminApi";

const initialForm = () => ({
  player_id: "",
  jersey_number: "",
  joined_at: new Date().toLocaleDateString("en-CA"),
});

export default function AddTeamPlayerModal({
  open,
  teamId,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const update = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const playerId = Number(form.player_id);

    if (!Number.isInteger(playerId) || playerId <= 0) {
      setError("Enter a valid existing Player ID.");
      return;
    }

    if (
      form.jersey_number &&
      (!Number.isInteger(Number(form.jersey_number)) ||
        Number(form.jersey_number) < 1 ||
        Number(form.jersey_number) > 99)
    ) {
      setError("Jersey number must be between 1 and 99.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await teamPlayersAdminApi.addPlayer(teamId, form);
      setForm(initialForm());
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(getTeamPlayerError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-team-player-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2
              id="add-team-player-title"
              className="text-lg font-semibold text-[#10213f]"
            >
              Add Player to Team
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Assign an existing registered player.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="team-player-id"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Existing Player ID *
            </label>

            <input
              id="team-player-id"
              type="number"
              min="1"
              step="1"
              required
              value={form.player_id}
              onChange={(event) =>
                update("player_id", event.target.value)
              }
              placeholder="Enter registered player ID"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
            />

            <p className="mt-1 text-xs text-slate-500">
              Use the Player ID from the existing Players module.
              Create new player records through Player Management.
            </p>
          </div>

          <div>
            <label
              htmlFor="team-jersey-number"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Jersey Number
            </label>

            <input
              id="team-jersey-number"
              type="number"
              min="1"
              max="99"
              step="1"
              value={form.jersey_number}
              onChange={(event) =>
                update("jersey_number", event.target.value)
              }
              placeholder="1â€“99 (optional)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
            />
          </div>

          <div>
            <label
              htmlFor="team-joined-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Joined On *
            </label>

            <input
              id="team-joined-date"
              type="date"
              required
              value={form.joined_at}
              onChange={(event) =>
                update("joined_at", event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066a44] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              Add Player
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
