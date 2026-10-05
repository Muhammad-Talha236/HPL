import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { playerDetail } from "./teamOwner.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };

test("team-owner invitation projection binds the exact owned team and exposes only account_linked", async () => {
  let teamLookup; let membershipLookup;
  const restores = [
    replace(prisma.team, "findFirst", async (input) => { teamLookup = input; return { team_id: 7, name: "Owned team", gender: "MEN", status: "ACTIVE" }; }),
    replace(prisma.teamPlayer, "findFirst", async (input) => { membershipLookup = input; return { team_player_id: 4, status: "ACTIVE", player: { player_id: 40, name: "Amin", user_id: 900 }, team: { team_id: 7, name: "Owned team" } }; }),
  ];
  const res = response(); await playerDetail({ params: { player_id: "40" }, query: { team_id: "7" }, user: { user_id: 11 } }, res, () => {});
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200);
  assert.equal(teamLookup.where.owner_id, 11);
  assert.deepEqual(membershipLookup.where, { player_id: 40, team_id: 7 });
  assert.equal(res.result.body.data.player.account_linked, true);
  assert.equal(JSON.stringify(res.result.body).includes("user_id"), false);
});
