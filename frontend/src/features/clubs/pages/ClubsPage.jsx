import { useCallback, useEffect, useState } from "react";
import ClubCard from "../components/ClubCard";
import { getClubs } from "../services/clubService";

const filters = [["All", ""], ["Men", "MEN"], ["Women", "WOMEN"]];

export default function ClubsPage() {
  const [state, setState] = useState({ status: "loading", clubs: [], pagination: null });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    try {
      const response = await getClubs({ page, limit: 12, ...(search ? { search } : {}), ...(gender ? { gender } : {}) });
      setState({ status: "success", clubs: response.data || [], pagination: response.pagination });
    } catch { setState({ status: "error", clubs: [], pagination: null }); }
  }, [gender, page, search]);
  // The loader only commits state after its network await; Oxlint cannot infer that boundary.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const submit = (event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };
  const setClubGender = (value) => { setPage(1); setGender(value); };
  const total = state.pagination?.total || 0;

  return <main className="min-h-screen bg-[#011427] pb-20 pt-20 text-white"><section className="border-b border-white/10 bg-[linear-gradient(135deg,#07192a,#011427)]"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8"><p className="text-[11px] font-bold tracking-[.22em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p><h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-[#ffad9f] sm:text-5xl">CLUB DIRECTORY</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Discover the clubs and active teams competing across the Hunza Premier League.</p></div></section><section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between"><form onSubmit={submit} className="w-full max-w-md"><label htmlFor="club-search" className="text-xs font-bold tracking-wide text-white/65">SEARCH CLUBS</label><div className="mt-2 flex gap-2"><input id="club-search" type="search" maxLength={100} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by club name" className="h-11 min-w-0 flex-1 rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30" /><button className="rounded-md border border-[#EEC058]/70 px-4 text-xs font-bold text-[#EEC058] hover:bg-[#EEC058] hover:text-[#011427]">SEARCH</button></div></form><fieldset><legend className="text-xs font-bold tracking-wide text-white/65">TEAM DIVISION</legend><div className="mt-2 flex flex-wrap gap-2">{filters.map(([label, value]) => <button key={label} type="button" aria-pressed={gender === value} onClick={() => setClubGender(value)} className={`rounded-full border px-4 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50 ${gender === value ? "border-[#FF553D] bg-[#FF553D] text-white" : "border-white/20 text-white/70 hover:border-white/50"}`}>{label}</button>)}</div></fieldset></div>{state.status === "loading" && <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/[.04]" />)}</div>}{state.status === "error" && <div role="alert" className="mt-7 rounded-xl border border-red-400/25 bg-red-400/10 p-6"><p className="text-sm text-red-100">Unable to load clubs right now.</p><button type="button" onClick={load} className="mt-4 rounded border border-red-200/30 px-4 py-2 text-xs font-bold text-red-100 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">TRY AGAIN</button></div>}{state.status === "success" && <><p role="status" className="mt-6 text-xs font-bold tracking-[.14em] text-white/55">{total} {total === 1 ? "CLUB" : "CLUBS"}</p>{state.clubs.length === 0 ? <div className="mt-6 rounded-xl border border-white/10 bg-white/[.03] p-8 text-sm text-white/60">{search || gender ? "No active clubs match these filters." : "No active clubs are available yet."}</div> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.clubs.map((club) => <ClubCard key={club.club_id} club={club} />)}</div>}{state.pagination && state.pagination.total_pages > 1 && <nav aria-label="Club directory pages" className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-6"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded border border-white/20 px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">PREVIOUS</button><span className="text-xs font-bold text-white/60">PAGE {page} OF {state.pagination.total_pages}</span><button type="button" disabled={page >= state.pagination.total_pages} onClick={() => setPage((current) => current + 1)} className="rounded border border-white/20 px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">NEXT</button></nav>}</>}</section></main>;
}
