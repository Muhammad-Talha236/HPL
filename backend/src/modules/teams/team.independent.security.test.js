import test from "node:test";
import assert from "node:assert/strict";
import { validationResult } from "express-validator";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { independentTeamApplicationValidation } from "./teamRegistration.validation.js";

const response = () => {
  const result = { statusCode: 200, body: null };

  return {
    result,
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
};

const validIndependentTeam = () => ({
  home_venue_id: 7,
  name: "Passu FC",
  gender: "MEN",
  team_type: "SENIOR",
  contact_phone: "+923001234567",
  declaration_accepted: true,
});

const validationErrors = async (body) => {
  const req = { body };

  for (const validation of independentTeamApplicationValidation) {
    await validation.run(req);
  }

  return validationResult(req).array();
};

test("independent application accepts only the reviewable application schema", async () => {
  const errors = await validationErrors(validIndependentTeam());

  assert.deepEqual(errors, []);
});

test("independent application rejects a browser-supplied contact email", async () => {
  const errors = await validationErrors({ ...validIndependentTeam(), contact_email: "forged@example.com" });
  assert.equal(errors.some((error) => error.type === "unknown_fields" && error.fields.some((field) => field.path === "contact_email")), true);
});

test("independent registration rejects ownership, role, status, and unknown fields", async () => {
  for (const prohibitedField of [
    "owner_id",
    "club_id",
    "role",
    "status",
    "unexpected",
  ]) {
    const errors = await validationErrors({
      ...validIndependentTeam(),
      [prohibitedField]: prohibitedField === "role" ? ROLES.SUPER_ADMIN : 1,
    });

    assert.equal(
      errors.some(
        (error) =>
          error.type === "unknown_fields" &&
          error.fields.some((field) => field.path === prohibitedField)
      ),
      true,
      `${prohibitedField} must be rejected`
    );
  }
});

test("independent application admits active USER and TEAM_OWNER roles only", () => {
  for (const role of [ROLES.CLUB_OWNER, ROLES.REFEREE, ROLES.SUPER_ADMIN]) {
    const res = response();
    let nextCalled = false;

    authorize(ROLES.USER, ROLES.TEAM_OWNER)(
      { user: { role } },
      res,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(nextCalled, false);
    assert.equal(res.result.statusCode, 403);
  }

  const res = response();
  let nextCalled = false;

  authorize(ROLES.USER, ROLES.TEAM_OWNER)(
    { user: { role: ROLES.USER } },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);

  const ownerRes = response();
  let ownerNextCalled = false;

  authorize(ROLES.USER, ROLES.TEAM_OWNER)(
    { user: { role: ROLES.TEAM_OWNER } },
    ownerRes,
    () => {
      ownerNextCalled = true;
    }
  );

  assert.equal(ownerNextCalled, true);
});
