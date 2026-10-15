const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;
const PAKISTANI_MOBILE_REGEX = /^03\d{9}$/;
const PASSWORD_MIN_LENGTH = 8;

export const validateRegisterForm = (formData) => {
  const errors = {};

  const name = formData.name.trim();
  const email = formData.email.trim();
  const phone = formData.phone.trim();

  if (!name) {
    errors.name = "Full name is required.";
  } else if (name.length < 2 || name.length > 100) {
    errors.name = "Full name must be between 2 and 100 characters.";
  } else if (!NAME_REGEX.test(name)) {
    errors.name =
      "Full name must start with a letter and use valid name characters only.";
  }

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (phone && !PAKISTANI_MOBILE_REGEX.test(phone)) {
    errors.phone =
      "Enter an 11-digit mobile number starting with 03.";
  }

  const password = formData.password;
  const confirmPassword = formData.confirmPassword;

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password =
      "Password must be at least 8 characters long.";
  } else {
    const requirements = getPasswordRequirements(password);
    const missing = [
      !requirements.uppercase && "one uppercase letter",
      !requirements.lowercase && "one lowercase letter",
      !requirements.number && "one number",
      !requirements.specialCharacter && "one special character",
    ].filter(Boolean);
    if (missing.length) {
      const last = missing.pop();
      errors.password = `Missing: ${missing.length ? `${missing.join(", ")} and ` : ""}${last}.`;
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword =
      "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword =
      "Passwords do not match.";
  }

  if (!formData.acceptTerms) {
    errors.acceptTerms =
      "You must agree before creating an account.";
  }

  return errors;
};

export const validateRegisterField = (field, formData) =>
  validateRegisterForm(formData)[field] || "";

export const getPasswordRequirements = (password) => ({
  minLength: password.length >= PASSWORD_MIN_LENGTH,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  specialCharacter: /[^A-Za-z0-9]/.test(password),
});

// This is policy coverage feedback, not an estimate of resistance to guessing.
// Only passwords satisfying every rule are displayed as Strong.
export const getPasswordStrength = (password) => {
  const requirements = getPasswordRequirements(password);
  const passed = Object.values(requirements).filter(Boolean).length;
  if (passed === 5) return { label: "Strong", segments: 3, barClass: "bg-[#087554]", textClass: "text-[#087554]" };
  if (requirements.minLength && passed >= 3) return { label: "Medium", segments: 2, barClass: "bg-amber-500", textClass: "text-amber-700" };
  return { label: "Weak", segments: 1, barClass: "bg-red-500", textClass: "text-red-600" };
};
