import test from "node:test";
import assert from "node:assert/strict";
import { getPasswordRequirements, getPasswordStrength, validateRegisterField, validateRegisterForm } from "./registerValidation.js";
import { validatePassword } from "../../../../../backend/src/utils/password.util.js";

const form = password => ({ name: "Ali Shah", email: "ali@example.com", phone: "", password, confirmPassword: password, acceptTerms: true });

test("strength progresses through weak, medium and strong using existing requirements", () => {
  assert.equal(getPasswordStrength("a").label, "Weak");
  assert.equal(getPasswordStrength("Ab1!").label, "Weak");
  assert.equal(getPasswordStrength("Password1").label, "Medium");
  assert.equal(getPasswordStrength("Password1!").label, "Strong");
  assert.equal(getPasswordStrength("Password1!").segments, 3);
});

test("validation explains all missing character requirements and clears after correction", () => {
  assert.equal(validateRegisterField("password", form("password1")), "Missing: one uppercase letter and one special character.");
  assert.equal(validateRegisterField("password", form("Password1")), "Missing: one special character.");
  assert.equal(validateRegisterField("password", form("Password1!")), "");
  assert.equal(validateRegisterField("password", form("Ab1!")), "Password must be at least 8 characters long.");
  assert.equal(validateRegisterField("password", form("")), "Password is required.");
});

test("frontend and backend agree for every combination of password requirements", () => {
  for (let mask = 0; mask < 32; mask++) {
    const password = `${mask & 1 ? "A" : ""}${mask & 2 ? "a" : ""}${mask & 4 ? "1" : ""}${mask & 8 ? "!" : ""}${mask & 16 ? "a".repeat(8) : ""}`;
    const valid = !validateRegisterForm(form(password)).password;
    assert.equal(valid, validatePassword(password).valid, `Policy mismatch for mask ${mask}`);
    assert.equal(getPasswordStrength(password).label === "Strong", Object.values(getPasswordRequirements(password)).every(Boolean));
  }
});

test("medium strength never permits account creation and confirm password must match", () => {
  assert.ok(validateRegisterForm(form("Password1")).password);
  assert.deepEqual(validateRegisterForm(form("Password1!")), {});
  assert.equal(validateRegisterForm({ ...form("Password1!"), confirmPassword: "Different1!" }).confirmPassword, "Passwords do not match.");
  assert.equal(validateRegisterForm({ ...form("Password1!"), confirmPassword: "" }).confirmPassword, "Please confirm your password.");
});
