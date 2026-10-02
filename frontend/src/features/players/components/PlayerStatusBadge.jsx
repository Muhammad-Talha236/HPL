const PlayerStatusBadge = ({ status }) => {
  if (!status) return null;

  const isActive = status === "ACTIVE";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] ${
        isActive
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-white/10 text-white/50"
      }`}
    >
      {status}
    </span>
  );
};

export default PlayerStatusBadge;
