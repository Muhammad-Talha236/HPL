import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import TeamCard from "../components/TeamCard";
import TeamCardSkeleton from "../components/TeamCardSkeleton";
import { getTeams } from "../services/teamService";
import {
  formatTeamGender,
  getTeamLocation,
} from "../utils/teamFormatters";

const TEAMS_PER_PAGE = 8;

const TeamsPage = () => {
  const [state, setState] = useState({
    data: [],
    status: "loading",
  });

  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("ALL");
  const [teamType, setTeamType] = useState("ALL");
  const [location, setLocation] = useState("ALL");
  const [sort, setSort] = useState("AZ");
  const [currentPage, setCurrentPage] = useState(1);

  const loadTeams = async (showLoading = true) => {
    if (showLoading) {
      setState((previous) => ({
        ...previous,
        status: "loading",
      }));
    }

    try {
      const teams = await getTeams();

      setState({
        data: teams,
        status: "success",
      });
    } catch (error) {
      console.error("Failed to load teams:", error);

      setState({
        data: [],
        status: "error",
      });
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadInitialTeams = async () => {
      try {
        const teams = await getTeams();

        if (isCurrent) {
          setState({
            data: teams,
            status: "success",
          });
        }
      } catch (error) {
        console.error("Failed to load teams:", error);

        if (isCurrent) {
          setState({
            data: [],
            status: "error",
          });
        }
      }
    };

    loadInitialTeams();

    return () => {
      isCurrent = false;
    };
  }, []);

  /*
   * ----------------------------------------------------
   * NORMALIZE GENDER
   * ----------------------------------------------------
   *
   * API currently contains values such as:
   * MEN / MALE
   * WOMEN / FEMALE
   *
   * We normalize them so both formats work correctly.
   */

  const normalizeGender = (value) => {
    const normalized = value?.trim().toUpperCase();

    if (normalized === "MEN" || normalized === "MALE") {
      return "MEN";
    }

    if (normalized === "WOMEN" || normalized === "FEMALE") {
      return "WOMEN";
    }

    return normalized || "";
  };

  /*
   * ----------------------------------------------------
   * FILTER OPTIONS
   * ----------------------------------------------------
   */

  const genders = useMemo(() => {
    const values = state.data
      .map((team) => normalizeGender(team.gender))
      .filter(Boolean);

    return [...new Set(values)];
  }, [state.data]);

  const teamTypes = useMemo(() => {
    const values = state.data
      .map((team) => team.team_type)
      .filter(Boolean);

    return [...new Set(values)];
  }, [state.data]);

  const locations = useMemo(() => {
    const values = state.data
      .map((team) => getTeamLocation(team))
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [state.data]);

  /*
   * ----------------------------------------------------
   * FILTER + SORT
   * ----------------------------------------------------
   */

  const filteredTeams = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const result = state.data.filter((team) => {
      const teamLocation = getTeamLocation(team) || "";
      const normalizedTeamGender = normalizeGender(team.gender);

      const matchesSearch =
        !searchValue ||
        team.name?.toLowerCase().includes(searchValue) ||
        teamLocation.toLowerCase().includes(searchValue) ||
        team.club?.name?.toLowerCase().includes(searchValue);

      const matchesGender =
        gender === "ALL" ||
        normalizedTeamGender === gender;

      const matchesType =
        teamType === "ALL" ||
        team.team_type === teamType;

      const matchesLocation =
        location === "ALL" ||
        teamLocation === location;

      return (
        matchesSearch &&
        matchesGender &&
        matchesType &&
        matchesLocation
      );
    });

    return [...result].sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";

      if (sort === "ZA") {
        return nameB.localeCompare(nameA);
      }

      return nameA.localeCompare(nameB);
    });
  }, [
    state.data,
    search,
    gender,
    teamType,
    location,
    sort,
  ]);

  /*
   * Reset pagination whenever filters change.
   */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, gender, teamType, location, sort]);

  /*
   * ----------------------------------------------------
   * PAGINATION
   * ----------------------------------------------------
   */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTeams.length / TEAMS_PER_PAGE)
  );

  const paginatedTeams = useMemo(() => {
    const start =
      (currentPage - 1) * TEAMS_PER_PAGE;

    return filteredTeams.slice(
      start,
      start + TEAMS_PER_PAGE
    );
  }, [filteredTeams, currentPage]);

  /*
   * ----------------------------------------------------
   * OVERVIEW STATS
   * ----------------------------------------------------
   */

  const stats = useMemo(() => {
    const maleTeams = state.data.filter(
      (team) =>
        normalizeGender(team.gender) === "MEN"
    ).length;

    const femaleTeams = state.data.filter(
      (team) =>
        normalizeGender(team.gender) === "WOMEN"
    ).length;

    /*
     * Count actual cities/locations.
     *
     * Your API has:
     * Aliabad
     * Karimabad
     * Nagar
     *
     * Therefore Locations = 3.
     */
    const uniqueLocations = new Set(
      state.data
        .map((team) => team.city?.trim())
        .filter(Boolean)
    ).size;

    return {
      total: state.data.length,
      male: maleTeams,
      female: femaleTeams,
      locations: uniqueLocations,
    };
  }, [state.data]);

  const clearFilters = () => {
    setSearch("");
    setGender("ALL");
    setTeamType("ALL");
    setLocation("ALL");
    setSort("AZ");
  };

  const hasActiveFilters =
    search ||
    gender !== "ALL" ||
    teamType !== "ALL" ||
    location !== "ALL";

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#07182d]">
      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative overflow-hidden border-b border-[#dce7e2] bg-white">
        {/* decorative shapes */}

        <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-[#078052]/[0.04] blur-3xl" />

        <div className="pointer-events-none absolute right-[12%] top-8 h-72 w-72 rounded-full border border-[#078052]/[0.05]" />

        <div className="pointer-events-none absolute right-[17%] top-20 h-48 w-48 rounded-full border border-[#078052]/[0.05]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-32 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-[2px] w-8 bg-[#078052]" />

              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#078052]">
                Our Teams
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.04em] text-[#07182d] sm:text-5xl lg:text-6xl">
              Meet the{" "}
              <span className="text-[#078052]">
                Teams
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#64748b] sm:text-base">
              Discover the teams representing communities across
              Hunza Premier League. Explore their profiles, squads,
              fixtures and journey through HPL competitions.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          LEAGUE OVERVIEW
      ================================================== */}

      {state.status === "success" && (
        <section className="border-b border-[#e1e9e5] bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-6 lg:grid-cols-4 lg:px-8">
            <StatItem
              icon={Shield}
              value={stats.total}
              label="Registered Teams"
            />

            <StatItem
              icon={Users}
              value={stats.male}
              label="Men's Teams"
            />

            <StatItem
              icon={Trophy}
              value={stats.female}
              label="Women's Teams"
            />

            <StatItem
              icon={MapPin}
              value={stats.locations}
              label="Locations"
              last
            />
          </div>
        </section>
      )}

      {/* ==================================================
          TEAMS
      ================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#078052]">
            Explore HPL
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#07182d]">
                All Teams
              </h2>

              <p className="mt-2 text-sm text-[#718096]">
                Browse teams currently available on the HPL platform.
              </p>
            </div>

            {state.status === "success" && (
              <p className="text-sm font-semibold text-[#64748b]">
                <span className="font-extrabold text-[#07182d]">
                  {filteredTeams.length}
                </span>{" "}
                {filteredTeams.length === 1
                  ? "team"
                  : "teams"}{" "}
                found
              </p>
            )}
          </div>
        </div>

        {/* FILTERS */}

      {/* FILTERS */}

<div className="mt-8 rounded-2xl border border-[#dfe8e4] bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
  <div className="grid items-center gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
    
    {/* Search */}
    <div className="relative">
      <Search
        size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]"
      />

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by team, club or location..."
        className="
          h-11
          w-full
          rounded-xl
          border
          border-[#d8e3df]
          bg-white
          pl-11
          pr-4
          text-sm
          text-[#07182d]
          outline-none
          transition
          placeholder:text-[#94a3b8]
          focus:border-[#078052]
          focus:ring-4
          focus:ring-[#078052]/10
        "
      />
    </div>

    {/* Gender */}
    <select
      value={gender}
      onChange={(event) => setGender(event.target.value)}
      className="
        h-11
        w-full
        cursor-pointer
        rounded-xl
        border
        border-[#d8e3df]
        bg-white
        px-3
        text-sm
        font-semibold
        text-[#334155]
        outline-none
        transition
        focus:border-[#078052]
        focus:ring-4
        focus:ring-[#078052]/10
      "
    >
      <option value="ALL">All Genders</option>

      {genders.map((value) => (
        <option key={value} value={value}>
          {value === "MEN"
            ? "Men"
            : value === "WOMEN"
              ? "Women"
              : formatTeamGender(value)}
        </option>
      ))}
    </select>

    {/* Team Type */}
    <select
      value={teamType}
      onChange={(event) => setTeamType(event.target.value)}
      className="
        h-11
        w-full
        cursor-pointer
        rounded-xl
        border
        border-[#d8e3df]
        bg-white
        px-3
        text-sm
        font-semibold
        text-[#334155]
        outline-none
        transition
        focus:border-[#078052]
        focus:ring-4
        focus:ring-[#078052]/10
      "
    >
      <option value="ALL">All Team Types</option>

      {teamTypes.map((value) => (
        <option key={value} value={value}>
          {value
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
              letter.toUpperCase()
            )}
        </option>
      ))}
    </select>

    {/* Location */}
    <select
      value={location}
      onChange={(event) => setLocation(event.target.value)}
      className="
        h-11
        w-full
        cursor-pointer
        rounded-xl
        border
        border-[#d8e3df]
        bg-white
        px-3
        text-sm
        font-semibold
        text-[#334155]
        outline-none
        transition
        focus:border-[#078052]
        focus:ring-4
        focus:ring-[#078052]/10
      "
    >
      <option value="ALL">All Locations</option>

      {locations.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>

    {/* Sort */}
    <select
      value={sort}
      onChange={(event) => setSort(event.target.value)}
      aria-label="Sort teams"
      className="
        h-11
        min-w-[145px]
        cursor-pointer
        rounded-xl
        border
        border-[#d8e3df]
        bg-white
        px-3
        text-sm
        font-bold
        text-[#334155]
        outline-none
        transition
        focus:border-[#078052]
        focus:ring-4
        focus:ring-[#078052]/10
      "
    >
      <option value="AZ">Name (A - Z)</option>
      <option value="ZA">Name (Z - A)</option>
    </select>
  </div>

  {/* Clear filters only when needed */}
  {hasActiveFilters && (
    <div className="mt-3 flex justify-end">
      <button
        type="button"
        onClick={clearFilters}
        className="text-xs font-bold text-[#078052] transition hover:text-[#055f3e]"
      >
        Clear all filters
      </button>
    </div>
  )}
</div>

        {/* LOADING */}

        {state.status === "loading" && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from(
              { length: 8 },
              (_, index) => (
                <TeamCardSkeleton
                  key={index}
                />
              )
            )}
          </div>
        )}

        {/* ERROR */}

        {state.status === "error" && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8"
          >
            <h3 className="font-bold text-red-900">
              Teams couldn't be loaded
            </h3>

            <p className="mt-2 text-sm text-red-700">
              We couldn't retrieve the teams from the HPL server.
              Please try again.
            </p>

            <button
              type="button"
              onClick={() => loadTeams()}
              className="mt-5 rounded-lg bg-[#07182d] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#078052]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}

        {state.status === "success" &&
          filteredTeams.length === 0 && (
            <div className="mt-8 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd8d3] bg-white px-6 text-center">
              <Shield
                size={38}
                strokeWidth={1.5}
                className="text-[#94a3b8]"
              />

              <h3 className="mt-4 text-lg font-extrabold text-[#07182d]">
                No teams found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#64748b]">
                No HPL teams match the selected filters.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 text-sm font-bold text-[#078052]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

        {/* TEAM GRID */}

        {state.status === "success" &&
          paginatedTeams.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedTeams.map(
                (team, index) => (
                  <div
                    key={team.team_id}
                    className="animate-[teamFade_.45s_ease-out_both]"
                    style={{
                      animationDelay: `${Math.min(
                        index * 60,
                        300
                      )}ms`,
                    }}
                  >
                    <TeamCard team={team} />
                  </div>
                )
              )}
            </div>
          )}

        {/* PAGINATION */}

        {state.status === "success" &&
          totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(page - 1, 1)
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8e3df] bg-white text-[#07182d] transition hover:border-[#078052] hover:text-[#078052] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={`h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition ${
                    currentPage === page
                      ? "bg-[#078052] text-white shadow-lg shadow-[#078052]/20"
                      : "border border-[#d8e3df] bg-white text-[#334155] hover:border-[#078052] hover:text-[#078052]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      page + 1,
                      totalPages
                    )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8e3df] bg-white text-[#07182d] transition hover:border-[#078052] hover:text-[#078052] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
      </section>

      {/* ==================================================
          BOTTOM CTA
      ================================================== */}

     
      <style>
        {`
          @keyframes teamFade {
            from {
              opacity: 0;
              transform: translateY(14px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </main>
  );
};

/*
 * ----------------------------------------------------
 * STAT COMPONENT
 * ----------------------------------------------------
 */

const StatItem = ({
  icon: Icon,
  value,
  label,
  last = false,
}) => {
  return (
    <div
      className={`flex items-center gap-4 py-6 ${
        !last
          ? "lg:border-r lg:border-[#e5ece9]"
          : ""
      } ${
        !last ? "pr-4" : ""
      } lg:px-7 first:lg:pl-0`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#078052]/10 text-[#078052]">
        <Icon size={20} />
      </div>

      <div>
        <p className="text-xl font-extrabold text-[#07182d]">
          {value}
        </p>

        <p className="mt-0.5 text-xs font-medium text-[#64748b]">
          {label}
        </p>
      </div>
    </div>
  );
};

export default TeamsPage;