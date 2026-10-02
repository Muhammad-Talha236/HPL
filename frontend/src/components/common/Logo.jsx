import { Link } from "react-router-dom";

const Logo = ({ className = "" }) => {
  return (
    <Link
      to="/"
      aria-label="Hunza Premier League home"
      className={`inline-flex items-center font-extrabold tracking-wider ${className}`}
    >
      <span className="text-white">HPL</span>
      <span className="text-[#FF553D]">.</span>
    </Link>
  );
};

export default Logo;