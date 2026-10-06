import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

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
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="
            text-[11px] font-bold
            tracking-[0.05em]
            text-[#0B1D2F]
            sm:text-[12px]
          "
        >
          {label}

          {required && (
            <span
              className="ml-1 text-[#078457]"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>

        {rightElement}
      </div>

      {/* Password Field */}
      <div className="relative">
        {/* Lock Icon */}
        <LockKeyhole
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
          className={`
            pointer-events-none
            absolute left-3.5 top-1/2
            -translate-y-1/2
            sm:left-4
            ${
              error
                ? "text-red-500"
                : "text-[#66758A]"
            }
          `}
        />

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
          aria-describedby={
            error ? `${id}-error` : undefined
          }
          className={`
            h-[48px] w-full
            rounded-lg border
            bg-white

            pl-11 pr-12
            sm:h-[52px]
            sm:pl-12 sm:pr-13

            text-[14px]
            text-[#0B1D2F]
            sm:text-[15px]

            outline-none
            transition-all duration-200

            placeholder:text-[#8A97AA]

            disabled:cursor-not-allowed
            disabled:bg-gray-50
            disabled:text-gray-400
            disabled:opacity-70

            ${
              error
                ? `
                  border-red-400
                  focus:border-red-500
                  focus:ring-4
                  focus:ring-red-500/10
                `
                : `
                  border-[#D8E0E8]
                  hover:border-[#B9C5D1]
                  focus:border-[#078457]
                  focus:ring-4
                  focus:ring-[#078457]/10
                `
            }
          `}
          {...props}
        />

        {/* Show / Hide Password */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
          aria-pressed={showPassword}
          className="
            absolute right-3.5 top-1/2
            flex h-8 w-8
            -translate-y-1/2
            items-center justify-center

            rounded-md
            text-[#66758A]

            transition-all duration-200

            hover:bg-[#F1F5F3]
            hover:text-[#078457]

            focus:outline-none
            focus:ring-2
            focus:ring-[#078457]/20

            disabled:cursor-not-allowed
            disabled:opacity-40

            sm:right-4
          "
        >
          {showPassword ? (
            <EyeOff
              size={18}
              strokeWidth={1.8}
            />
          ) : (
            <Eye
              size={18}
              strokeWidth={1.8}
            />
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="
            mt-1.5
            text-[11px]
            leading-4
            text-red-500
            sm:text-[12px]
          "
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;