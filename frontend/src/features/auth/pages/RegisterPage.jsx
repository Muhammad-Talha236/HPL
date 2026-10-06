import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import PasswordInput from "../components/PasswordInput";
import { registerUser } from "../services/authService";

import {
  getPasswordRequirements,
  validateRegisterField,
  validateRegisterForm,
} from "../utils/registerValidation";

import logo from "../../../assets/logo.png";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const getApiFieldErrors = (error) => {
  const apiErrors = error.response?.data?.errors;

  if (!Array.isArray(apiErrors)) {
    return {};
  }

  return apiErrors.reduce((fieldErrors, item) => {
    if (item?.field && item?.message) {
      fieldErrors[item.field] = item.message;
    }

    return fieldErrors;
  }, {});
};

/* =========================================================
   REGISTER INPUT
========================================================= */

const RegisterInput = ({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  autoComplete,
  error,
  disabled,
  required = false,
  icon: Icon,
  ...props
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2 block
          text-[11px] font-bold
          tracking-[0.07em]
          text-[#10283F]
          sm:text-xs
        "
      >
        {label}

        {required && (
          <span className="ml-1 text-[#087554]">*</span>
        )}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            strokeWidth={1.8}
            className="
              pointer-events-none
              absolute left-4 top-1/2
              -translate-y-1/2
              text-[#71849A]
            "
          />
        )}

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : undefined
          }
          className={`
            h-12 w-full
            rounded-lg border
            bg-white
            ${Icon ? "pl-11" : "pl-4"}
            pr-4
            text-sm text-[#10283F]
            outline-none
            transition-all duration-200

            placeholder:text-[#8A9AAF]

            hover:border-[#B8C5D0]

            focus:border-[#087554]
            focus:ring-4
            focus:ring-[#087554]/[0.07]

            disabled:cursor-not-allowed
            disabled:bg-gray-50
            disabled:opacity-70

            ${
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : "border-[#D7E0E7]"
            }
          `}
          {...props}
        />
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-[11px] text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
};

/* =========================================================
   PASSWORD REQUIREMENT
========================================================= */

const PasswordRequirement = ({ passed, children }) => {
  return (
    <li
      className={`
        flex items-center gap-1.5
        text-[10px]
        sm:text-[11px]
        ${
          passed
            ? "text-[#087554]"
            : "text-[#7E8B95]"
        }
      `}
    >
      <span
        className={`
          grid h-4 w-4
          shrink-0
          place-items-center
          rounded-full

          ${
            passed
              ? "bg-[#E3F4ED] text-[#087554]"
              : "bg-[#EDF1F3] text-[#89959D]"
          }
        `}
      >
        {passed ? (
          <Check size={10} strokeWidth={3} />
        ) : (
          <span className="h-1 w-1 rounded-full bg-current" />
        )}
      </span>

      {children}
    </li>
  );
};

/* =========================================================
   REGISTER PAGE
========================================================= */

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState(initialFormData);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRequirements =
    getPasswordRequirements(formData.password);

  /* =======================================================
     CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    const fieldValue =
      name === "phone"
        ? value.replace(/\D/g, "").slice(0, 11)
        : type === "checkbox"
          ? checked
          : value;

    const nextFormData = {
      ...formData,
      [name]: fieldValue,
    };

    setFormData(nextFormData);

    if (errors[name]) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [name]: validateRegisterField(
          name,
          nextFormData
        ),
      }));
    }

    if (
      name === "password" &&
      errors.confirmPassword
    ) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        confirmPassword: validateRegisterField(
          "confirmPassword",
          nextFormData
        ),
      }));
    }

    if (serverError) {
      setServerError("");
    }
  };

  /* =======================================================
     BLUR
  ======================================================= */

  const handleBlur = (event) => {
    const { name } = event.target;

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: validateRegisterField(
        name,
        formData
      ),
    }));
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const validationErrors =
      validateRegisterForm(formData);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError("");
    setIsSubmitting(true);

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      if (formData.phone.trim()) {
        registrationData.phone =
          formData.phone.trim();
      }

      await registerUser(registrationData);

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
        },
      });
    } catch (error) {
      const status = error.response?.status;
      const backendMessage =
        error.response?.data?.message;

      const apiFieldErrors =
        getApiFieldErrors(error);

      if (
        Object.keys(apiFieldErrors).length > 0
      ) {
        setErrors(apiFieldErrors);
        return;
      }

      if (status === 409) {
        setServerError(
          backendMessage ||
            "An account with this email already exists."
        );
      } else if (status === 400) {
        setServerError(
          backendMessage ||
            "Please check your information and try again."
        );
      } else if (status >= 500) {
        setServerError(
          "Something went wrong on the server. Please try again later."
        );
      } else if (!error.response) {
        setServerError(
          "Unable to connect to the server. Please check your connection and try again."
        );
      } else {
        setServerError(
          backendMessage ||
            "Unable to create your account. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div
        className="
          mx-auto
          flex min-h-screen
          w-full max-w-[620px]
          flex-col
          justify-center

          px-4 py-7

          sm:px-5
          sm:py-8

          lg:px-5
          lg:py-8
        "
      >
        {/* =========================
            LOGO
        ========================== */}

        <div className="mb-3 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center"
            aria-label="Hunza Premier League Home"
          >
            <img
              src={logo}
              alt="Hunza Premier League"
              className="
                h-[88px] w-auto
                object-contain
                sm:h-[70px]
              "
            />
          </Link>
        </div>

        {/* =========================
            HEADER
        ========================== */}

        <header className="mb-5 text-center">
          <h1
            className="
              text-[27px]
              font-extrabold
              leading-tight
              tracking-[-0.035em]
              text-[#09233D]

              sm:text-[32px]
            "
          >
            Create Your Account
          </h1>

          <p
            className="
              mx-auto mt-2
              max-w-md
              text-[13px]
              leading-5
              text-[#738195]

              sm:text-sm
            "
          >
            Join Hunza Premier League and become part of
            our football community.
          </p>
        </header>

        {/* =========================
            FORM CARD
        ========================== */}

        <section
          className="
            w-full
            rounded-2xl
            border border-[#DEE6E3]
            bg-white

            p-5

            shadow-[0_16px_45px_rgba(15,35,50,0.07)]

            sm:p-6
          "
        >
          {/* SERVER ERROR */}

          {serverError && (
            <div
              role="alert"
              className="
                mb-4
                rounded-lg
                border border-red-200
                bg-red-50
                px-4 py-3
                text-xs
                leading-5
                text-red-600
              "
            >
              {serverError}
            </div>
          )}

          {/* =========================
              FORM
          ========================== */}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            {/* FULL NAME */}

            <RegisterInput
              id="name"
              name="name"
              label="FULL NAME"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
              error={errors.name}
              disabled={isSubmitting}
              icon={UserRound}
              required
            />

            {/* EMAIL */}

            <RegisterInput
              id="email"
              name="email"
              type="email"
              label="EMAIL ADDRESS"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              error={errors.email}
              disabled={isSubmitting}
              icon={Mail}
              required
            />

            {/* PHONE */}

            <RegisterInput
              id="phone"
              name="phone"
              type="tel"
              label="PHONE NUMBER (OPTIONAL)"
              placeholder="03XXXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              error={errors.phone}
              disabled={isSubmitting}
              icon={Phone}
            />

            {/* =========================
                PASSWORDS
            ========================== */}

            <div
              className="
                grid
                grid-cols-1
                gap-4

                sm:grid-cols-2
                sm:gap-3
              "
            >
              <PasswordInput
                id="register-password"
                name="password"
                label="PASSWORD"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                error={errors.password}
                disabled={isSubmitting}
                required
              />

              <PasswordInput
                id="confirm-password"
                name="confirmPassword"
                label="CONFIRM PASSWORD"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                error={errors.confirmPassword}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* =========================
                PASSWORD REQUIREMENTS
            ========================== */}

            {formData.password && (
              <div
                className="
                  rounded-lg
                  border border-[#E1E8E5]
                  bg-[#F8FAF9]
                  p-3
                "
              >
                <p
                  className="
                    mb-2
                    text-[10px]
                    font-bold
                    tracking-[0.08em]
                    text-[#52625B]
                  "
                >
                  PASSWORD REQUIREMENTS
                </p>

                <ul
                  className="
                    grid
                    grid-cols-1
                    gap-x-3
                    gap-y-1.5

                    sm:grid-cols-2
                  "
                >
                  <PasswordRequirement
                    passed={
                      passwordRequirements.minLength
                    }
                  >
                    At least 8 characters
                  </PasswordRequirement>

                  <PasswordRequirement
                    passed={
                      passwordRequirements.uppercase
                    }
                  >
                    One uppercase letter
                  </PasswordRequirement>

                  <PasswordRequirement
                    passed={
                      passwordRequirements.lowercase
                    }
                  >
                    One lowercase letter
                  </PasswordRequirement>

                  <PasswordRequirement
                    passed={
                      passwordRequirements.number
                    }
                  >
                    One number
                  </PasswordRequirement>

                  <PasswordRequirement
                    passed={
                      passwordRequirements.specialCharacter
                    }
                  >
                    One special character
                  </PasswordRequirement>
                </ul>
              </div>
            )}

            {/* =========================
                TERMS
            ========================== */}

            <div>
              <label
                className="
                  flex cursor-pointer
                  items-start
                  gap-2.5
                "
              >
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className="
                    mt-0.5
                    h-4 w-4
                    shrink-0
                    cursor-pointer
                    accent-[#087554]
                  "
                />

                <span
                  className="
                    text-[11px]
                    leading-5
                    text-[#68766F]

                    sm:text-xs
                  "
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="
                      font-semibold
                      text-[#087554]
                      hover:underline
                    "
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="
                      font-semibold
                      text-[#087554]
                      hover:underline
                    "
                  >
                    Privacy Policy
                  </Link>{" "}
                  of the Hunza Premier League.
                </span>
              </label>

              {errors.acceptTerms && (
                <p
                  role="alert"
                  className="
                    ml-6 mt-1
                    text-[10px]
                    text-red-500
                  "
                >
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* =========================
                CREATE ACCOUNT BUTTON
            ========================== */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                group
                flex h-12
                w-full
                items-center
                justify-center
                gap-2.5

                rounded-lg
                bg-[#087D5B]

                text-sm
                font-bold
                text-white

                shadow-[0_7px_18px_rgba(8,125,91,0.16)]

                transition-all
                duration-200

                hover:bg-[#076E50]
                hover:shadow-[0_9px_22px_rgba(8,125,91,0.22)]

                focus:outline-none
                focus:ring-4
                focus:ring-[#087D5B]/15

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isSubmitting ? (
                <>
                  <span
                    className="
                      h-4 w-4
                      animate-spin
                      rounded-full
                      border-2
                      border-white/40
                      border-t-white
                    "
                  />

                  Creating Account...
                </>
              ) : (
                <>
                  Create Account

                  <ArrowRight
                    size={17}
                    className="
                      transition-transform
                      duration-200
                      group-hover:translate-x-1
                    "
                  />
                </>
              )}
            </button>
          </form>

          {/* =========================
              LOGIN LINK
          ========================== */}

          <div
            className="
              mt-4
              border-t
              border-[#E9EEEB]
              pt-4
              text-center
            "
          >
            <p className="text-xs text-[#78857F]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="
                  font-bold
                  text-[#087554]
                  transition-colors
                  hover:text-[#055E44]
                "
              >
                Login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;