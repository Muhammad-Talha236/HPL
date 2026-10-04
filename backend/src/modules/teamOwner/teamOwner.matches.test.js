import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { matchDetail, matches } from "./teamOwner.controller.js";

const owner = { user_id: 101, role: ROLES.TEAM_OWNER };
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const match = (id, home = 11, away = 21) => ({ match_id: id, competition_id: 5, season_id: 1, home_team_id: home, away_team_id: away, venue_id: 3, referee_id: 8, match_date: new Date("2026-10-10"), start_time: new Date("1970-01-01T12:00:00Z"), started_at: id === 1 ? new Date("2026-10-10T12:00:00Z") : null, status: id === 1 ? "LIVE" : "SCHEDULED", home_score: 2, away_score: 1, competition: { competition_id: 5, name: "Cup", gender: "MEN" }, season: { season_id: 1, name: "2026" }, home_team: { team_id: home, name: `Team ${home}`, logo: null }, away_team: { team_id: away, name: `Team ${away}`, logo: null }, venue: { venue_id: 3, name: "Ground", city: "Hunza" }, referee: { referee_id: 8, name: "Official", profile_photo: null } });

test("Team Owner match list scopes home, away, and own-vs-own fixtures once", async () => {
  let findQuery; const restores = [replace(prisma.match, "findMany", async (input) => { findQuery = input; return [match(1, 11, 21), match(2, 21, 12), match(3, 11, 12)]; }), replace(prisma.match, "count", async () => 3), replace(prisma, "$transaction", async (operations) => Promise.all(operations))];
  const res = response(); await matches({ user: owner, query: { page: "1", limit: "20" } }, res, (error) => { throw error; }); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.deepEqual(res.result.body.data.map((item) => item.match_id), [1, 2, 3]); assert.equal(new Set(res.result.body.data.map((item) => item.match_id)).size, 3);
  const scope = findQuery.where.AND[0].OR; assert.deepEqual(scope, [{ home_team: { owner_id: 101 } }, { away_team: { owner_id: 101 } }]);
});

test("Team Owner match filters validate foreign team ownership and remain inside owned match scope", async () => {
  let matchQuery; const foreignRestores = [replace(prisma.team, "findFirst", async () => null), replace(prisma.match, "findMany", async () => { throw new Error("must not query foreign team"); })];
  const foreign = response(); await matches({ user: owner, query: { team_id: "21" } }, foreign, (error) => { throw error; }); foreignRestores.reverse().forEach((restore) => restore()); assert.equal(foreign.result.statusCode, 404);
  const validRestores = [replace(prisma.team, "findFirst", async () => ({ team_id: 12, name: "A2" })), replace(prisma.match, "findMany", async (input) => { matchQuery = input; return [match(2, 21, 12)]; }), replace(prisma.match, "count", async () => 1), replace(prisma, "$transaction", async (operations) => Promise.all(operations))];
  const valid = response(); await matches({ user: owner, query: { team_id: "12", competition_id: "5", status: "SCHEDULED", page: "1", limit: "1" } }, valid, (error) => { throw error; }); validRestores.reverse().forEach((restore) => restore());
  assert.equal(valid.result.statusCode, 200); assert.deepEqual(matchQuery.where.AND.slice(1), [{ OR: [{ home_team_id: 12 }, { away_team_id: 12 }] }, { competition_id: 5 }, { status: "SCHEDULED" }]);
});

test("Team Owner match list rejects invalid pagination and status values", async () => {
  for (const query of [{ page: "0" }, { limit: "51" }, { status: "DRAFT" }]) { const res = response(); await matches({ user: owner, query }, res, (error) => { throw error; }); assert.equal(res.result.statusCode, 400); }
});

test("Team Owner match detail permits an owned fixture with safe events, squads, and official data", async () => {
  let detailQuery; const full = { ...match(1), events: [{ event_id: 50, team_id: 11, player_id: 40, related_player_id: null, event_type: "GOAL", minute: 12, extra_time: null, description: "Goal", team: { team_id: 11, name: "Team 11", logo: null }, player: { player_id: 40, name: "Player", profile_photo: null, position: "MID" }, related_player: null }], players: [{ match_player_id: 70, team_id: 11, player_id: 40, starting_status: "STARTER", is_on_field: true, position: "MID", shirt_number: 9, minutes_played: 12, entered_at: new Date(), exited_at: null, player: { player_id: 40, name: "Player", profile_photo: null, position: "MID" } }] };
  const restore = replace(prisma.match, "findFirst", async (input) => { detailQuery = input; return full; }); const res = response(); await matchDetail({ user: owner, params: { match_id: "1" } }, res, (error) => { throw error; }); restore();
  assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.data.squads.home.players[0].shirt_number, 9); assert.equal(res.result.body.data.events.all[0].event_type, "GOAL"); assert.deepEqual(detailQuery.where.AND[0].OR, [{ home_team: { owner_id: 101 } }, { away_team: { owner_id: 101 } }]);
  const payload = JSON.stringify(res.result.body); for (const field of ["password", "password_hash", "token", "reset_token", "phone", "license_number", "email", "audit"]) assert.equal(payload.includes(field), false);
});

test("Team Owner match detail returns 404 for a foreign match before revealing any detail", async () => {
  const restore = replace(prisma.match, "findFirst", async () => null); const res = response(); await matchDetail({ user: owner, params: { match_id: "99" } }, res, (error) => { throw error; }); restore(); assert.equal(res.result.statusCode, 404); assert.equal(res.result.body.message, "Match not found");
});

test("Team Owner match namespace contains read-only routes only", async () => {
  const source = await readFile(new URL("./teamOwner.routes.js", import.meta.url), "utf8");
  assert.match(source, /router\.get\("\/matches"/); assert.doesNotMatch(source, /router\.(post|put|patch|delete)\("\/matches/);
});
