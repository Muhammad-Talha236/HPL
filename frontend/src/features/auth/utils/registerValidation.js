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
  } else if (!/[A-Z]/.test(password)) {
    errors.password =
      "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    errors.password =
      "Password must contain at least one lowercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.password =
      "Password must contain at least one number.";
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password =
      "Password must contain at least one special character.";
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
