const AuthInput = ({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  autoComplete,
  required = false,
  disabled = false,
  error = "",
  className = "",
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="
            mb-1.5 block
            text-[11px] font-bold
            tracking-[0.08em] text-white/70
          "
        >
          {label}
        </label>
      )}

      <input
        id={id}
        name={name}
        type={type}
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
          px-3.5
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

export default AuthInput;