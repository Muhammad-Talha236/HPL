import { Link } from "react-router-dom";

const variants = {
  primary:
    "bg-[#FF553D] text-white hover:bg-[#e94a35] border border-[#FF553D]",

  secondary:
    "bg-[#1A2D40] text-white hover:bg-[#243b52] border border-white/10",

  outline:
    "bg-transparent text-[#FF553D] border border-[#FF553D] hover:bg-[#FF553D] hover:text-white",

  ghost:
    "bg-transparent text-white border border-white/15 hover:bg-white/10",
};

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  to,
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const classes = `
    inline-flex items-center justify-center
    rounded-md font-bold tracking-wide
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50
    disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
    ${variants[variant] ?? variants.primary}
    ${sizes[size] ?? sizes.md}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;