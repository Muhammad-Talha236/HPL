const statusStyles = {
  ACTIVE: "bg-[#12a568] text-white",
  INACTIVE: "bg-[#f1f4f5] text-[#607084]",
};

const statusLabels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

const SeasonStatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded px-2 py-1 text-[9px] font-extrabold ${
      statusStyles[status] || statusStyles.INACTIVE
    }`}
  >
    {statusLabels[status] || status || "Unavailable"}
  </span>
);

export default SeasonStatusBadge;
