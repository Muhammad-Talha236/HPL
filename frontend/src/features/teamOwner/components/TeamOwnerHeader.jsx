import { Menu } from "lucide-react";

export default function TeamOwnerHeader({ user, onMenu, menuButtonRef, drawerOpen }) {
  return <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
    <div className="flex min-w-0 items-center gap-3">
      <button ref={menuButtonRef} type="button" onClick={onMenu} aria-label="Open Team Owner navigation" aria-haspopup="dialog" aria-expanded={drawerOpen} aria-controls="team-owner-drawer" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-[#10213F] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#087554] lg:hidden"><Menu size={19} /></button>
      <p className="min-w-0 text-[13px] font-medium text-slate-500"><span className="hidden sm:inline">Hunza Premier League <span className="mx-2 text-slate-300">/</span></span><span className="font-semibold text-[#10213F]">Team Owner</span></p>
    </div>
    <div className="flex min-w-0 items-center gap-2.5">
      <p className="max-w-[110px] truncate text-xs font-semibold text-[#10213F] sm:max-w-[200px] sm:text-sm" title={user?.name}>{user?.name || "Team Owner"}</p>
      {user?.profile_image ? <img src={user.profile_image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EAF5EF] text-xs font-bold text-[#087554]" aria-hidden="true">{user?.name?.trim().charAt(0).toUpperCase() || "T"}</span>}
    </div>
  </header>;
}
