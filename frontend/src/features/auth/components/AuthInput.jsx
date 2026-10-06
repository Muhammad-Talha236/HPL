import {
  Mail,
  User,
  Phone,
} from "lucide-react";

const getFieldIcon = (name, type) => {
  if (type === "email" || name === "email") {
    return Mail;
  }

  if (type === "tel" || name === "phone") {
    return Phone;
  }

  return User;
};

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
  const Icon = getFieldIcon(name, type);

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="
            mb-2 block
            text-[12px] font-bold
            tracking-[0.06em]
            text-[#0B1D2F]
          "
        >
          {label}

          {required && (
            <span
              className="ml-1 text-[#0B7A53]"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <Icon
          size={19}
          strokeWidth={1.8}
          aria-hidden="true"
          className={`
            pointer-events-none
            absolute left-4 top-1/2
            -translate-y-1/2
            transition-colors duration-200
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
          type={type}
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
            h-[52px] w-full
            rounded-lg border
            bg-white
            pl-12 pr-4

            text-[15px]
            text-[#0B1D2F]

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
      </div>

      {/* Error */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="
            mt-1.5
            text-[12px]
            leading-4
            text-red-500
          "
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;