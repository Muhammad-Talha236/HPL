import { Link } from "react-router-dom";
import hplLogo from "../../assets/Logo.png";

const Logo = ({ className = "" }) => {
  return (
    <Link
      to="/"
      aria-label="Hunza Premier League home"
      className={`relative flex shrink-0 items-center ${className}`}
    >
      <img
        src={hplLogo}
        alt="Hunza Premier League"
        className="
          h-[82px] w-auto object-contain
          sm:h-[88px]
          lg:h-[100px]
        "
      />
    </Link>
  );
};

export default Logo;