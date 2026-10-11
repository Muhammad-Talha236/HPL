import test from "node:test";
import assert from "node:assert/strict";
import { validationResult } from "express-validator";
import { createMatchValidation } from "./match.validation.js";

const validFixture = {
  competition_id: 4,
  season_id: 2,
  home_team_id: 10,
  away_team_id: 11,
  venue_id: 3,
  referee_id: 7,
  match_date: "2026-11-02",
  start_time: "14:30",
  match_notes: null,
};

const validate = async (body) => {
  const request = { body, query: {}, params: {} };
  for (const rule of createMatchValidation) await rule.run(request);
  return validationResult(request).array();
};

test("match creation accepts the schedule form contract", async () => {
  assert.deepEqual(await validate(validFixture), []);
});

test("match creation reports the exact field sent as zero by the former form flow", async () => {
  const errors = await validate({ ...validFixture, season_id: 0 });
  assert.equal(errors.length, 1);
  assert.equal(errors[0].path, "season_id");
  assert.equal(errors[0].msg, "Season ID must be a positive integer");
});

test("match creation preserves strict same-team validation", async () => {
  const errors = await validate({ ...validFixture, away_team_id: 10 });
  assert.ok(errors.some((error) => error.path === "away_team_id" && error.msg === "Home team and away team cannot be the same"));
});
