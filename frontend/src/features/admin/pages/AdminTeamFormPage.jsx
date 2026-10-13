
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Shield,
  Users,
} from "lucide-react";

import MediaPicker from "../../media/components/MediaPicker";

import {
  TeamInput,
  TeamSelect,
  TeamTextarea,
} from "../components/AdminTeamFormFields";

import {
  adminTeamCreateService,
  getTeamCreateError,
} from "../services/adminTeamCreateService";

const INITIAL_FORM = {
  name: "",
  club_id: "",
  owner_id: "",
  home_venue_id: "",
  gender: "MEN",
  team_type: "",
  logo: "",
  region: "",
  district: "",
  city: "",
  description: "",
  contact_email: "",
  contact_phone: "",
};

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-[#078052]">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#10213F]">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AdminTeamFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);

  const [options, setOptions] = useState({
    clubs: [],
    venues: [],
    owners: [],
    pagination: {},
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const set = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadOptions() {
      setLoading(true);
      setError("");

      try {
        const result =
          await adminTeamCreateService.getOptions(
            controller.signal
          );

        if (!controller.signal.aborted) {
          setOptions(result);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getTeamCreateError(err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOptions();

    return () => controller.abort();
  }, [reloadKey]);

  const activeClubs = options.clubs.filter(
    (club) => club.status === "ACTIVE"
  );

  const activeVenues = options.venues.filter(
    (venue) => venue.status === "ACTIVE"
  );

  const activeOwners = options.owners.filter(
    (owner) =>
      owner.status === "ACTIVE"
  );

  const submit = async (event) => {
    event.preventDefault();

    if (busy) return;

    if (
      !form.club_id ||
      !form.owner_id ||
      !form.home_venue_id ||
      !form.name.trim() ||
      !form.team_type.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const team = await adminTeamCreateService.create(form);

      if (!team?.team_id) {
        throw new Error("Team created but response did not contain a team ID.");
      }

      navigate(`/admin/teams/${team.team_id}`, {
        replace: true,
        state: {
          notice:
            "Team created successfully. You can now manage its players.",
        },
      });
    } catch (err) {
      setError(getTeamCreateError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-w-0 space-y-5 bg-[#F4F7FB] p-4 text-[#10213F] sm:p-6">

      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-[#078052]">
          Dashboard
        </Link>
        <span>â€º</span>
        <Link
          to="/admin/teams"
          className="hover:text-[#078052]"
        >
          Teams
        </Link>
        <span>â€º</span>
        <span className="font-medium text-slate-700">
          Create Team
        </span>
      </nav>

      {/* HEADER */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            Create New Team
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Register a club team and assign its owner and home venue.
          </p>
        </div>

        <Link
          to="/admin/teams"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          Back to Teams
        </Link>
      </header>

      {/* WORKFLOW NOTICE */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
        <CheckCircle2
          size={19}
          className="mt-0.5 shrink-0 text-[#078052]"
        />

        <div>
          <h2 className="text-sm font-bold text-emerald-900">
            Players are not required during team creation
          </h2>

          <p className="mt-1 text-xs leading-5 text-emerald-800">
            First create the team. After registration, its
            authorized owner or administrator can invite and
            manage players separately.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}

          {loading && (
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
          <Loader2
            size={20}
            className="animate-spin text-[#078052]"
          />
          Loading available clubs, venues and owners...
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="max-w-5xl space-y-5"
        >
          {/* TEAM INFORMATION */}
          <Section
            icon={Shield}
            title="Basic Team Information"
            description="Provide the team identity and category."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TeamInput
                label="Team Name"
                value={form.name}
                onChange={(value) => set("name", value)}
                required
                maxLength={100}
                placeholder="Enter team name"
              />

              <TeamSelect
                label="Team Gender"
                value={form.gender}
                onChange={(value) => set("gender", value)}
                required
                options={[
                  { value: "MEN", label: "Men" },
                  { value: "WOMEN", label: "Women" },
                ]}
                valueKey="value"
                labelKey="label"
              />

              <TeamInput
                label="Team Type"
                value={form.team_type}
                onChange={(value) => set("team_type", value)}
                required
                maxLength={50}
                placeholder="e.g. Senior"
              />

              <div className="sm:col-span-2">
                <MediaPicker
                  label="Team Logo"
                  category="teams"
                  value={form.logo}
                  onChange={(value) => set("logo", value)}
                />
              </div>
            </div>
          </Section>

          {/* ORGANISATION AND OWNERSHIP */}
          <Section
            icon={Building2}
            title="Organisation & Ownership"
            description="Associate the team with an active club and eligible team owner."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TeamSelect
                label="Club"
                value={form.club_id}
                onChange={(value) => set("club_id", value)}
                required
                options={activeClubs}
                valueKey="club_id"
                labelKey="name"
                placeholder="Select an active club"
              />

              <TeamSelect
                label="Team Owner"
                value={form.owner_id}
                onChange={(value) => set("owner_id", value)}
                required
                options={activeOwners}
                valueKey="user_id"
                labelKey="name"
                placeholder="Select an active team owner"
              />

              <TeamSelect
                label="Home Venue"
                value={form.home_venue_id}
                onChange={(value) =>
                  set("home_venue_id", value)
                }
                required
                options={activeVenues}
                valueKey="venue_id"
                labelKey="name"
                placeholder="Select an active venue"
              />
            </div>

            {activeClubs.length === 0 && (
              <p className="mt-3 text-xs text-amber-700">
                No active clubs available. Create or activate a club first.
              </p>
            )}

            {activeOwners.length === 0 && (
              <p className="mt-3 text-xs text-amber-700">
                No active accounts available.
                Assign an eligible team owner before continuing.
              </p>
            )}

            {activeVenues.length === 0 && (
              <p className="mt-3 text-xs text-amber-700">
                No active venues available.
                Create or activate a venue first.
              </p>
            )}

            {(options.pagination?.clubs?.total_pages > 1 ||
              options.pagination?.owners?.total_pages > 1) && (
              <p className="mt-3 text-xs text-amber-700">
                More clubs or owners exist than this selector
                currently displays. Searchable pagination
                will be needed to select records beyond the
                first 50.
              </p>
            )}
          </Section>

          {/* LOCATION */}
          <Section
            icon={MapPin}
            title="Location & Contact"
            description="Optional team location and contact information."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TeamInput
                label="City"
                value={form.city}
                onChange={(value) => set("city", value)}
                maxLength={100}
              />

              <TeamInput
                label="District"
                value={form.district}
                onChange={(value) => set("district", value)}
                maxLength={100}
              />

              <TeamInput
                label="Region"
                value={form.region}
                onChange={(value) => set("region", value)}
                maxLength={100}
              />

              <TeamInput
                label="Contact Email"
                type="email"
                value={form.contact_email}
                onChange={(value) => set("contact_email", value)}
              />

              <TeamInput
                label="Contact Phone"
                type="tel"
                value={form.contact_phone}
                onChange={(value) => set("contact_phone", value)}
                maxLength={30}
              />
            </div>

            <div className="mt-4">
              <TeamTextarea
                label="Team Description"
                value={form.description}
                onChange={(value) => set("description", value)}
              />
            </div>
          </Section>

          {/* SUBMISSION */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users size={16} />
              Squad management is available after creation.
            </div>

            <div className="flex gap-3">
              <Link
                to="/admin/teams"
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  busy ||
                  !activeClubs.length ||
                  !activeVenues.length ||
                  !activeOwners.length ||
                  options.pagination?.clubs?.total_pages > 1 ||
                  options.pagination?.owners?.total_pages > 1
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Create Team
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}
