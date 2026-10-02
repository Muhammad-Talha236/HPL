const SeasonSelector = ({ seasons, value, onChange, disabled = false }) => (
  <div className="max-w-sm">
    <label
      htmlFor="season-selector"
      className="mb-2 block text-[11px] font-bold tracking-[0.14em] text-white/60"
    >
      EXPLORE A SEASON
    </label>
    <select
      id="season-selector"
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="h-11 w-full rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm font-semibold text-white outline-none transition focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="" disabled>
        Select a season
      </option>
      {seasons.map((season) => (
        <option key={season.season_id} value={season.season_id}>
          {season.name} {season.status === "ACTIVE" ? "(Active)" : ""}
        </option>
      ))}
    </select>
  </div>
);

export default SeasonSelector;
