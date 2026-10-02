import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import useAuth from "../../../hooks/useAuth";

import AuthInput from "../components/AuthInput";
import PasswordInput from "../components/PasswordInput";

import { validateLoginForm } from "../utils/loginValidation";

import heroImage from "../../../assets/hero.png";

const initialFormData = {
  email: "",
  password: "",
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
  const [registrationSuccess] = useState(
    () => Boolean(location.state?.registrationSuccess)
  );

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      navigate(location.pathname, {
        replace: true,
        state: null,
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

      const requestedPath = location.state?.from?.pathname;
      const destination =
        requestedPath && requestedPath.startsWith("/")
          ? requestedPath
          : "/";

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
          backendMessage || "Unable to login. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="
        relative flex min-h-[calc(100vh-80px)]
        items-center justify-center
        bg-cover bg-center
        px-5 pb-12 pt-28
        sm:px-6
        lg:px-8 lg:pb-14 lg:pt-32
      "
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      {/* Dark Background Overlay */}
      <div className="absolute inset-0 bg-[#011427]/85" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#011427]/30 via-transparent to-[#011427]" />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="rounded-xl border border-white/10 bg-[#0B1D2F]/90 p-6 shadow-2xl backdrop-blur-md sm:p-7">
          {/* Header */}
          <div className="mb-7 text-center">
            <p className="mb-3 text-xs font-bold tracking-[0.25em] text-[#EEC058]">
              HUNZA PREMIER LEAGUE
            </p>

            <h1 className="text-3xl font-extrabold tracking-wide text-white">
              WELCOME BACK
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Sign in to access your Hunza Premier League account.
            </p>
          </div>

          {/* Server Error */}
          {registrationSuccess && (
            <div
              role="status"
              className="mb-5 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm leading-5 text-green-200"
            >
              Your account has been created. Please sign in to continue.
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300"
            >
              {serverError}
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              className="mt-2"
            >
              {isSubmitting ? "SIGNING IN..." : "LOGIN"}
            </Button>
          </form>

          {/* Signup Link */}
          <p className="mt-6 text-center text-sm text-white/50">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-[#FF553D] transition-colors duration-200 hover:text-[#EEC058]"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="mt-5 text-center text-xs leading-5 text-white/35">
          By continuing, you agree to the Hunza Premier League terms and
          privacy policy.
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
