import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { getClubOwnerPlayer, getClubOwnerTeam, updateClubOwnerProfile } from "./clubOwner.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const swap = (object, key, value) => { const previous = object[key]; object[key] = value; return () => { object[key] = previous; }; };

test("club owner routes deny every non-club-owner role", () => {
  for (const role of [ROLES.USER, ROLES.TEAM_OWNER, ROLES.REFEREE, ROLES.SUPER_ADMIN]) {
    const res = response(); let allowed = false;
    authorize(ROLES.CLUB_OWNER)({ user: { role } }, res, () => { allowed = true; });
    assert.equal(allowed, false); assert.equal(res.result.statusCode, 403);
  }
});

test("club owner team and player details reject malformed IDs before querying", async () => {
  const team = response(); const player = response();
  await getClubOwnerTeam({ params: { team_id: "other" }, user: { user_id: 1 } }, team, () => {});
  await getClubOwnerPlayer({ params: { player_id: "other" }, user: { user_id: 1 } }, player, () => {});
  assert.equal(team.result.statusCode, 400); assert.equal(player.result.statusCode, 400);
});

test("club owner cannot access another club resource and profile blocks mass assignment", async () => {
  const restore = swap(prisma.team, "findFirst", async () => null);
  const team = response(); await getClubOwnerTeam({ params: { team_id: "99" }, user: { user_id: 1 } }, team, () => {}); restore();
  assert.equal(team.result.statusCode, 404);
  const profile = response(); await updateClubOwnerProfile({ params: { club_id: "3" }, body: { owner_id: 8, status: "ACTIVE" }, user: { user_id: 1 } }, profile, () => {});
  assert.equal(profile.result.statusCode, 400); assert.match(profile.result.body.message, /Protected/);
});
