const RefereeAvatar = ({ referee, size = "lg" }) => {
  const dimensions = size === "sm" ? "h-10 w-10 text-sm" : "h-20 w-20 text-2xl";
  if (referee?.profile_photo) return <img src={referee.profile_photo} alt="" className={`${dimensions} rounded-full border border-[#EEC058]/35 object-cover`} />;
  const initials = (referee?.name || "R").split(" ").slice(0, 2).map((name) => name[0]).join("").toUpperCase();
  return <span className={`${dimensions} flex shrink-0 items-center justify-center rounded-full border border-[#EEC058]/35 bg-[#10283d] font-extrabold text-[#ffad9f]`}>{initials}</span>;
};
export default RefereeAvatar;
