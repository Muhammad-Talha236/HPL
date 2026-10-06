import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import useAuth from "../../../hooks/useAuth";

import AuthInput from "../components/AuthInput";
import PasswordInput from "../components/PasswordInput";

import { validateLoginForm } from "../utils/loginValidation";

import logo from "../../../assets/logo.png";

const initialFormData = {
  email: "",
  password: "",
};

const hasControlCharacter = (value) =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });

const safeInternalReturnPath = (from) => {
  const pathname = from?.pathname;

  if (typeof pathname !== "string") {
    return "/";
  }

  try {
    const decodedPath = decodeURIComponent(pathname);

    return pathname.startsWith("/") &&
      !pathname.startsWith("//") &&
      decodedPath.startsWith("/") &&
      !decodedPath.startsWith("//") &&
      !decodedPath.includes("\\") &&
      !decodedPath.includes("://") &&
      !hasControlCharacter(decodedPath)
      ? pathname
      : "/";
  } catch {
    return "/";
  }
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

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [registrationSuccess] = useState(() =>
    Boolean(location.state?.registrationSuccess)
  );

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      navigate(location.pathname, {
        replace: true,
        state: location.state?.from
          ? { from: location.state.from }
          : null,
      });
    }
  }, [location.pathname, location.state, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [name]: "",
      }));
    }

    if (serverError) {
      setServerError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateLoginForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError("");
    setIsSubmitting(true);

    try {
      const credentials = {
        email: formData.email.trim(),
        password: formData.password,
      };

      await login(credentials);

      const destination = safeInternalReturnPath(
        location.state?.from
      );

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      const status = error.response?.status;
      const backendMessage = error.response?.data?.message;

      const apiFieldErrors = getApiFieldErrors(error);

      if (Object.keys(apiFieldErrors).length > 0) {
        setErrors(apiFieldErrors);
        return;
      }

      if (status === 429) {
        setServerError(
          backendMessage ||
            "Too many login attempts. Please try again later."
        );
      } else if (status === 401) {
        setServerError(
          backendMessage || "Invalid email or password."
        );
      } else if (status === 403) {
        setServerError(
          backendMessage || "Your account is not active."
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
            "Unable to login. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9F8] px-4 sm:px-6">
      <div
        className="
          mx-auto flex min-h-screen
          w-full max-w-[480px]
          flex-col items-center justify-center
          py-5
          sm:py-6
          lg:h-screen lg:min-h-0 lg:py-3
        "
      >
        {/* =========================
            HPL Logo
        ========================== */}
        <Link
          to="/"
          aria-label="Go to Hunza Premier League home"
          className="
            mb-2 flex shrink-0
            items-center justify-center
          "
        >
          <img
            src={logo}
            alt="Hunza Premier League"
            className="
              h-[68px] w-auto
              object-contain
              sm:h-[74px]
              lg:h-[76px]
            "
          />
        </Link>

        {/* =========================
            Page Heading
        ========================== */}
        <div className="mb-5 shrink-0 text-center">
          <h1
            className="
              text-[28px] font-extrabold
              tracking-[-0.035em]
              text-[#0A1F33]
              sm:text-[32px]
            "
          >
            Welcome Back
          </h1>

          <p
            className="
              mx-auto mt-1.5
              max-w-[360px]
              text-[13px] leading-5
              text-[#73808C]
              sm:text-sm
            "
          >
            Login to your Hunza Premier League account
          </p>
        </div>

        {/* =========================
            Login Card
        ========================== */}
        <section
          className="
            w-full
            rounded-[16px]
            border border-[#E2E8E5]
            bg-white
            p-5
            shadow-[0_12px_40px_rgba(15,23,42,0.06)]
            sm:p-6
          "
        >
          {/* Registration Success */}
          {registrationSuccess && (
            <div
              role="status"
              className="
                mb-4 flex items-start gap-3
                rounded-lg
                border border-[#BCE5D2]
                bg-[#F0FAF5]
                px-3.5 py-2.5
                text-[12px] leading-5
                text-[#087554]
                sm:text-[13px]
              "
            >
              <span
                className="
                  mt-0.5 grid
                  h-5 w-5 shrink-0
                  place-items-center
                  rounded-full
                  bg-[#087554]
                  text-white
                "
              >
                <Check
                  size={12}
                  strokeWidth={3}
                />
              </span>

              <span>
                Your account has been created successfully.
                Please login to continue.
              </span>
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div
              role="alert"
              className="
                mb-4 rounded-lg
                border border-red-200
                bg-red-50
                px-4 py-2.5
                text-[12px] leading-5
                text-red-600
                sm:text-[13px]
              "
            >
              {serverError}
            </div>
          )}

          {/* =========================
              Login Form
          ========================== */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            <AuthInput
              id="email"
              name="email"
              type="email"
              label="EMAIL ADDRESS"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              error={errors.email}
              disabled={isSubmitting}
              required
            />

            <PasswordInput
              id="password"
              name="password"
              label="PASSWORD"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              error={errors.password}
              disabled={isSubmitting}
              required
            />

            {/* Remember + Forgot Password */}
            <div
              className="
                flex items-center
                justify-between
                gap-4
              "
            >
              <label
                className="
                  flex cursor-pointer
                  items-center gap-2
                  text-[12px]
                  text-[#667085]
                  sm:text-[13px]
                "
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  disabled={isSubmitting}
                  className="
                    h-4 w-4
                    rounded
                    border-[#CBD5D0]
                    accent-[#087554]
                  "
                />

                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="
                  shrink-0
                  text-[12px] font-bold
                  text-[#087554]
                  transition-colors
                  hover:text-[#065E44]
                  sm:text-[13px]
                "
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                flex h-[48px] w-full
                items-center justify-center
                gap-2.5
                rounded-lg
                bg-[#087554]

                text-[13px] font-bold
                tracking-[0.02em]
                text-white

                shadow-[0_8px_18px_rgba(8,117,84,0.18)]

                transition-all duration-200

                hover:bg-[#066A4C]
                hover:shadow-[0_10px_22px_rgba(8,117,84,0.24)]

                focus:outline-none
                focus:ring-4
                focus:ring-[#087554]/15

                disabled:cursor-not-allowed
                disabled:opacity-60

                sm:h-[50px]
                sm:text-sm
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

                  Logging in...
                </>
              ) : (
                <>
                  Login

                  <ArrowRight
                    size={17}
                    strokeWidth={2}
                  />
                </>
              )}
            </button>
          </form>

          {/* =========================
              Sign Up Link
          ========================== */}
          <div
            className="
              mt-5
              border-t border-[#EDF0EE]
              pt-4
              text-center
            "
          >
            <p
              className="
                text-[12px]
                text-[#7A8580]
                sm:text-[13px]
              "
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="
                  font-bold
                  text-[#087554]
                  transition-colors
                  hover:text-[#065E44]
                "
              >
                Sign Up
              </Link>
            </p>
          </div>
        </section>

        {/* =========================
            Terms
        ========================== */}
        <p
          className="
            mx-auto mt-3
            max-w-sm
            shrink-0
            text-center
            text-[10px] leading-4
            text-[#98A29D]
            sm:text-[11px]
          "
        >
          By continuing, you agree to the Hunza Premier League
          Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
};

export default LoginPage;