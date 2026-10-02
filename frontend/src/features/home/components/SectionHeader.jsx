const SectionHeader = ({ title, description }) => (
  <div className="mb-6 sm:mb-8">
    <p className="text-[11px] font-bold tracking-[0.2em] text-[#EEC058]">
      HUNZA PREMIER LEAGUE
    </p>
    <h2 className="mt-2 text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
      {title}
    </h2>
    <span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" />
    {description && (
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
        {description}
      </p>
    )}
  </div>
);

export default SectionHeader;
