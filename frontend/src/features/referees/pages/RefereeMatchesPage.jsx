import { useEffect, useState } from "react";
import AssignmentCard from "../components/AssignmentCard";
import { getMyAssignments } from "../services/refereeService";

const tabs = ["SCHEDULED", "LIVE", "COMPLETED"];
const RefereeMatchesPage = () => {
  const [status, setStatus] = useState("SCHEDULED");
  const [state, setState] = useState({ status: "loading", data: [] });
  useEffect(() => { let active = true; getMyAssignments({ status, limit: 24 }).then((data) => active && setState({ status: "success", data: data?.data || data || [] })).catch(() => active && setState({ status: "error", data: [] })); return () => { active = false; }; }, [status]);
  return <main className="min-h-screen bg-[#011427] pb-20 pt-24 text-white"><div className="mx-auto max-w-6xl px-5"><h1 className="text-3xl font-extrabold text-[#ffad9f]">MY MATCHES</h1><div className="mt-6 flex gap-2">{tabs.map((tab) => <button key={tab} onClick={() => setStatus(tab)} className={`rounded px-3 py-2 text-xs font-bold ${status === tab ? "bg-[#FF553D]" : "border border-white/15 text-white/65"}`}>{tab}</button>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{state.status === "loading" ? <p className="text-white/55">Loading assignments…</p> : state.data.map((match) => <AssignmentCard key={match.match_id} match={match} workspace />)}{state.status === "success" && !state.data.length && <p className="text-white/55">No {status.toLowerCase()} assignments.</p>}</div></div></main>;
};
export default RefereeMatchesPage;
