import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { createMatchEvent } from "./matchEvent.controller.js";
import { authorizeAssignedRefereeOrAdmin } from "../referees/refereeAssignment.middleware.js";
import { completeMatch, startMatch } from "../matches/match.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const swap = (object, key, value) => { const previous = object[key]; object[key] = value; return () => { object[key] = previous; }; };
const liveMatch = { match_id: 4, status: "LIVE", started_at: new Date(Date.now() - 5 * 60 * 1000), home_team_id: 7, away_team_id: 8, home_score: 0, away_score: 0, referee_id: 3 };

test("live event creation rejects an exact duplicate before score mutation", async () => {
  const restores = [
    swap(prisma.match, "findUnique", async () => liveMatch),
    swap(prisma.team, "findUnique", async () => ({ team_id: 7, owner_id: 1, club: null })),
    swap(prisma.player, "findUnique", async () => ({ player_id: 21, name: "Player", status: "ACTIVE" })),
    swap(prisma, "$transaction", async (callback) => callback({
      match: { findUnique: async () => liveMatch },
      matchEvent: { findFirst: async () => ({ event_id: 99 }) },
    })),
  ];
  const res = response();
  await createMatchEvent({ user: { user_id: 1, role: ROLES.SUPER_ADMIN }, body: { match_id: 4, team_id: 7, player_id: 21, event_type: "GOAL", minute: 3 } }, res);
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 409);
  assert.match(res.result.body.message, /identical/i);
});

test("an unassigned referee cannot pass match-scoped authorization", async () => {
  const restores = [
    swap(prisma.referee, "findFirst", async () => ({ referee_id: 12 })),
    swap(prisma.match, "findUnique", async () => ({ referee_id: 3 })),
  ];
  const res = response(); let nextCalled = false;
  await authorizeAssignedRefereeOrAdmin({ params: {}, user: { user_id: 9, role: ROLES.REFEREE }, body: { match_id: 4 } }, res, () => { nextCalled = true; });
  restores.reverse().forEach((restore) => restore());
  assert.equal(nextCalled, false);
  assert.equal(res.result.statusCode, 403);
});

test("a non-live match cannot be finalized a second time", async () => {
  const restore = swap(prisma.match, "findUnique", async () => ({ match_id: 4, competition_id: 2, status: "COMPLETED", started_at: new Date(), home_score: 1, away_score: 0 }));
  const res = response();
  await completeMatch({ params: { match_id: "4" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, res);
  restore();
  assert.equal(res.result.statusCode, 400);
  assert.match(res.result.body.message, /cannot be completed/i);
});

test("start rejects a live fixture rather than resetting its clock or lineup", async () => {
  const restore = swap(prisma.match, "findUnique", async () => ({ match_id: 4, status: "LIVE", started_at: new Date(), home_team_id: 7, away_team_id: 8 }));
  const res = response();
  await startMatch({ params: { match_id: "4" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, res);
  restore();
  assert.equal(res.result.statusCode, 400);
  assert.match(res.result.body.message, /scheduled/i);
});

test("inactive players are rejected before an event transaction begins", async () => {
  let transactionCalled = false;
  const restores = [
    swap(prisma.match, "findUnique", async () => liveMatch),
    swap(prisma.team, "findUnique", async () => ({ team_id: 7, owner_id: 1, club: null })),
    swap(prisma.player, "findUnique", async () => ({ player_id: 21, name: "Inactive", status: "INACTIVE" })),
    swap(prisma, "$transaction", async () => { transactionCalled = true; }),
  ];
  const res = response();
  await createMatchEvent({ user: { user_id: 1, role: ROLES.SUPER_ADMIN }, body: { match_id: 4, team_id: 7, player_id: 21, event_type: "YELLOW_CARD", minute: 3 } }, res);
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 400);
  assert.equal(transactionCalled, false);
});
