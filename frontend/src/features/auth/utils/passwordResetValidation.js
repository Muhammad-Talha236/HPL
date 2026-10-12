import { validateRegisterField } from "./registerValidation.js";

export const validateResetForm = (newPassword, confirmPassword) => {
  const form = { name: "", email: "", phone: "", password: newPassword, confirmPassword, acceptTerms: false };
  const errors = {};
  const passwordError = validateRegisterField("password", form);
  const confirmError = validateRegisterField("confirmPassword", form);
  if (passwordError) errors.newPassword = passwordError;
  else if (new TextEncoder().encode(newPassword).length > 72) errors.newPassword = "Password must be at most 72 bytes.";
  if (confirmError) errors.confirmPassword = confirmError;
  return errors;
};

