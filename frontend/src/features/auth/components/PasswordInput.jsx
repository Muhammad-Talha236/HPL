import { useState } from "react";

const PasswordInput = ({
  id,
  label = "PASSWORD",
  name = "password",
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete = "current-password",
  required = false,
  disabled = false,
  error = "",
  className = "",
  rightElement = null,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((previous) => !previous);
  };

  return (
    <div className={className}>
      {/* Label Row */}
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="
            text-[11px] font-bold
            tracking-[0.08em] text-white/70
          "
        >
          {label}
        </label>

        {rightElement}
      </div>

      {/* Password Field */}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            h-11 w-full
            rounded-md border
            bg-[#1A2D40]
            px-3.5 pr-[68px]
            text-sm text-white
            outline-none
            transition-colors duration-200

            placeholder:text-white/30

            disabled:cursor-not-allowed
            disabled:opacity-50

            ${
              error
                ? "border-red-500/80 focus:border-red-500"
                : "border-white/10 focus:border-[#FF553D]"
            }
          `}
          {...props}
        />

        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label={
            showPassword ? "Hide password" : "Show password"
          }
          aria-pressed={showPassword}
          className="
            absolute right-3.5 top-1/2
            -translate-y-1/2

            text-[11px] font-bold
            tracking-wide text-white/45

            transition-colors duration-200

            hover:text-white/80

            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {showPassword ? "HIDE" : "SHOW"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-[11px] leading-4 text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;