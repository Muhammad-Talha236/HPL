import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import AuthInput from "../components/AuthInput";
import PasswordInput from "../components/PasswordInput";

import { registerUser } from "../services/authService";
import {
  getPasswordRequirements,
  validateRegisterField,
  validateRegisterForm,
} from "../utils/registerValidation";

import heroImage from "../../../assets/hero.png";

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

const PasswordRequirement = ({ passed, children }) => {
  return (
    <li
      className={`flex items-center gap-2 text-[11px] ${
        passed ? "text-green-400" : "text-white/40"
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
          passed
            ? "bg-green-500/15 text-green-400"
            : "bg-white/5 text-white/30"
        }`}
      >
        {passed ? "✓" : "•"}
      </span>

      {children}
    </li>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRequirements = getPasswordRequirements(
    formData.password
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
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
        [name]: validateRegisterField(name, nextFormData),
      }));
    }

    if (name === "password" && errors.confirmPassword) {
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

  const handleBlur = (event) => {
    const { name } = event.target;

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: validateRegisterField(name, formData),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors =
      validateRegisterForm(formData);

    if (Object.keys(validationErrors).length > 0) {
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
        registrationData.phone = formData.phone.trim();
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
      const apiFieldErrors = getApiFieldErrors(error);

      if (Object.keys(apiFieldErrors).length > 0) {
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
          "Unable to connect to the server. Please try again."
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
    <section
      className="
        relative flex min-h-screen
        items-center justify-center
        bg-cover bg-center
        px-4 pb-12 pt-28
        sm:px-6
        lg:pb-14 lg:pt-28
      "
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      {/* Background overlays */}
      <div className="absolute inset-0 bg-[#011427]/90" />

      <div className="absolute inset-0 bg-gradient-to-b from-[#011427]/20 via-transparent to-[#011427]" />

      {/* Register container */}
      <div className="relative z-10 w-full max-w-[520px]">
        <div
          className="
            rounded-xl border border-white/10
            bg-[#0B1D2F]/95
            p-5 shadow-2xl backdrop-blur-md
            sm:p-7
          "
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <p className="mb-2 text-[11px] font-bold tracking-[0.24em] text-[#EEC058]">
              HUNZA PREMIER LEAGUE
            </p>

            <h1 className="text-3xl font-extrabold tracking-wide text-white">
              JOIN THE LEAGUE
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-white/45">
              Create your account and become part of the
              Hunza Premier League community.
            </p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div
              role="alert"
              className="
                mb-4 rounded-md
                border border-red-500/30
                bg-red-500/10
                px-3.5 py-2.5
                text-xs leading-5 text-red-300
              "
            >
              {serverError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            <AuthInput
              id="name"
              name="name"
              type="text"
              label="FULL NAME"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
              error={errors.name}
              disabled={isSubmitting}
              required
            />

            <AuthInput
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
              required
            />

            <AuthInput
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
            />

            {/* Password row */}
            <div className="grid gap-4 sm:grid-cols-2">
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

            {/* Password Requirements */}
            {formData.password && (
              <div
                className="
                  rounded-md border border-white/10
                  bg-white/[0.025]
                  px-3.5 py-3
                "
              >
                <p className="mb-2 text-[10px] font-bold tracking-wider text-white/50">
                  PASSWORD REQUIREMENTS
                </p>

                <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  <PasswordRequirement
                    passed={passwordRequirements.minLength}
                  >
                    At least 8 characters
                  </PasswordRequirement>

                  <PasswordRequirement
                    passed={passwordRequirements.uppercase}
                  >
                    One uppercase letter
                  </PasswordRequirement>

                  <PasswordRequirement
                    passed={passwordRequirements.lowercase}
                  >
                    One lowercase letter
                  </PasswordRequirement>

                  <PasswordRequirement
                    passed={passwordRequirements.number}
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

            {/* Terms */}
            <div>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className="
                    mt-0.5 h-3.5 w-3.5 shrink-0
                    accent-[#FF553D]
                    disabled:cursor-not-allowed
                  "
                />

                <span className="text-[11px] leading-[18px] text-white/45">
                  I agree to the Terms of Service and Privacy
                  Policy of the Hunza Premier League.
                </span>
              </label>

              {errors.acceptTerms && (
                <p
                  role="alert"
                  className="mt-1.5 text-[11px] text-red-400"
                >
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-center text-xs text-white/45">
              Already have an account?{" "}
              <Link
                to="/login"
                className="
                  font-bold text-[#EEC058]
                  transition-colors duration-200
                  hover:text-[#FF553D]
                "
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
