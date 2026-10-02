const styles = {
  ACTIVE: "border-green-400/25 bg-green-400/10 text-green-300",
  INACTIVE: "border-white/15 bg-white/5 text-white/55",
};

const TeamStatusBadge = ({ status }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] ${styles[status] || styles.INACTIVE}`}>{status}</span>;

export default TeamStatusBadge;
