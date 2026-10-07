import { Link } from "react-router-dom";

const variants = {
  primary:
    "bg-[#087554] text-white hover:bg-[#0b644a] border border-[#087554]",

  secondary:
    "bg-[#10283d] text-white hover:bg-[#173750] border border-[#10283d]",

  outline:
    "bg-transparent text-[#087554] border border-[#087554] hover:bg-[#087554] hover:text-white",

  ghost:
    "bg-transparent text-[#14231d] border border-[#cbd9d1] hover:bg-[#f4f7f5]",
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
    rounded-lg font-bold tracking-wide
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[#087554]/30
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