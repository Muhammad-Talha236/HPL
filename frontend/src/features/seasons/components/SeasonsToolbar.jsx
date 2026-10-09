import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";

const SeasonsToolbar = ({ search, sort, onSearchChange, onSortChange }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div><h2 className="text-[23px] font-extrabold tracking-[-.035em] text-[#13223a]">All Seasons</h2><span className="mt-1.5 block h-[3px] w-12 rounded-full bg-[#11965c]" /></div>
    <div className="flex flex-col gap-2 sm:flex-row">
      <label className="relative block"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#708096]" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search seasons by name or year..." className="h-9 w-full rounded-md border border-[#dce6e2] bg-white pl-9 pr-3 text-[11px] text-[#17263b] outline-none placeholder:text-[#98a4b3] focus:border-[#139d65] focus:ring-2 focus:ring-[#139d65]/15 sm:w-64" /></label>
      <label className="relative">{sort === "latest" ? <ArrowDownAZ size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#406050]" /> : <ArrowUpAZ size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#406050]" />}<select value={sort} onChange={(event) => onSortChange(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#dce6e2] bg-white py-0 pl-8 pr-8 text-[11px] font-semibold text-[#33465c] outline-none focus:border-[#139d65] focus:ring-2 focus:ring-[#139d65]/15 sm:w-32" aria-label="Sort seasons"><option value="latest">Latest first</option><option value="oldest">Oldest first</option></select></label>
    </div>
  </div>
);

export default SeasonsToolbar;
