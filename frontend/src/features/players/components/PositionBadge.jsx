import { formatPosition } from "../utils/playerFormatters";

const PositionBadge = ({ position }) => {
  const label = formatPosition(position);
  if (!label) return null;

  return (
    <span className="inline-flex rounded-full border border-[#FF553D]/35 bg-[#FF553D]/15 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-[#ffad9f]">
      {label.toUpperCase()}
    </span>
  );
};

export default PositionBadge;
