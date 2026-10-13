import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import prisma from "../../database/prisma.js";
import { getMe } from "./auth.controller.js";
import { getClubs } from "../clubs/club.controller.js";
import { getCompetitions } from "../competitions/competition.controller.js";
import { getMatches } from "../matches/match.controller.js";
import { getRankings } from "../rankings/ranking.controller.js";
import { getSeasons } from "../seasons/season.controller.js";
import { getStandings } from "../standings/standing.controller.js";
import { getTeamPlayers } from "../teamPlayers/teamPlayer.controller.js";
import { getTeams } from "../teams/team.controller.js";
import { getVenues } from "../venues/venue.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const privateFields = ["password", "token", "reset", "owner_id", "contact_email", "contact_phone", "phone", "license", "audit"];

test("public Team, Club, and TeamPlayer directory queries use safe bounded projections", async () => {
  let teamQuery; let clubQuery; let membershipQuery;
  const restores = [
    replace(prisma.team, "findMany", async (input) => { teamQuery = input; return []; }),
    replace(prisma.club, "findMany", async (input) => { clubQuery = input; return []; }),
    replace(prisma.club, "count", async () => 0),
    replace(prisma.teamPlayer, "findMany", async (input) => { membershipQuery = input; return []; }),
    replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
  await getTeams({}, response()); await getClubs({}, response()); await getTeamPlayers({}, response()); restores.reverse().forEach((restore) => restore());
  for (const query of [teamQuery, membershipQuery]) { assert.equal(query.take, 100); const select = JSON.stringify(query.select).toLowerCase(); for (const field of privateFields) assert.equal(select.includes(field), false); }
  assert.equal(clubQuery.take, 12); assert.equal(clubQuery.where.status, "ACTIVE"); const clubSelect = JSON.stringify(clubQuery.select).toLowerCase(); for (const field of privateFields) assert.equal(clubSelect.includes(field), false);
  assert.equal(JSON.stringify(teamQuery.select).includes("home_venue"), true); assert.equal(JSON.stringify(membershipQuery.select).includes("jersey_number"), true);
});

test("public Player and Match list projections remain bounded and exclude private operational fields", async () => {
  let playerQuery; let matchQuery;
  const restores = [
    replace(prisma.player, "findMany", async (input) => { playerQuery = input; return []; }),
    replace(prisma.match, "findMany", async (input) => { matchQuery = input; return []; }),
    replace(prisma.match, "count", async () => 0),
    replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
  const { getPlayers } = await import("../players/player.controller.js");
  await getPlayers({}, response()); await getMatches({ query: {} }, response()); restores.reverse().forEach((restore) => restore());
  assert.equal(playerQuery.take, 100); assert.equal(matchQuery.take, 50);
  const playerSelect = JSON.stringify(playerQuery.select).toLowerCase(); const matchSelect = JSON.stringify(matchQuery.select).toLowerCase();
  for (const field of ["phone", "password", "token", "owner"]) assert.equal(playerSelect.includes(field), false);
  for (const field of ["match_notes", "created_at", "updated_at", "phone", "license", "token"]) assert.equal(matchSelect.includes(field), false);
});

test("authenticated account identity always derives from req.user, never a client user_id", async () => {
  let query; const restore = replace(prisma.user, "findUnique", async (input) => { query = input; return { user_id: 7, name: "User", email: "user@example.test", phone: null, role: "USER", status: "ACTIVE", profile_image: null }; });
  const res = response(); await getMe({ user: { user_id: 7 }, query: { user_id: "99" }, body: { user_id: 99 } }, res); restore();
  assert.equal(res.result.statusCode, 200); assert.equal(query.where.user_id, 7); const payload = JSON.stringify(res.result.body).toLowerCase(); for (const field of ["password", "token", "reset", "cookie"]) assert.equal(payload.includes(field), false);
});

test("remaining public football directories retain bounded safe reads without response-contract changes", async () => {
  let competitionQuery; let rankingQuery; let standingQuery; let seasonQuery; let venueQuery;
  const restores = [
    replace(prisma.competition, "findMany", async (input) => { competitionQuery = input; return []; }),
    replace(prisma.teamRanking, "findMany", async (input) => { rankingQuery = input; return []; }),
    replace(prisma.teamStanding, "findMany", async (input) => { standingQuery = input; return []; }),
    replace(prisma.season, "findMany", async (input) => { seasonQuery = input; return []; }),
    replace(prisma.venue, "findMany", async (input) => { venueQuery = input; return []; }),
  ];
  await getCompetitions({}, response()); await getRankings({ query: {} }, response()); await getStandings({ params: { competition_id: "1" } }, response(), () => {}); await getSeasons({}, response()); await getVenues({}, response()); restores.reverse().forEach((restore) => restore());
  for (const [label, query] of [["competition", competitionQuery], ["ranking", rankingQuery], ["standing", standingQuery], ["season", seasonQuery], ["venue", venueQuery]]) assert.equal(query?.take, 100, `${label} list must be capped`);
  const venueSelect = JSON.stringify(venueQuery.select).toLowerCase(); for (const field of ["phone", "password", "token", "audit"]) assert.equal(venueSelect.includes(field), false);
});

test("USER account route and role-aware Navbar destinations remain lightweight and isolated", async () => {
  const [app, navbar, guard] = await Promise.all([
    readFile(new URL("../../../../frontend/src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/components/navigation/Navbar.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/routes/UserAccountRoute.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(app, /<Route element=\{<UserAccountRoute \/>\}>/); assert.match(app, /path="\/account"/);
  assert.match(guard, /user\?\.role === "USER"/);
  for (const [role, path] of [["USER", "/account"], ["CLUB_OWNER", "/club"], ["SUPER_ADMIN", "/admin"], ["REFEREE", "/referee/dashboard"]]) assert.match(navbar, new RegExp(`user\\.role === "${role}"[\\s\\S]{0,220}${path.replaceAll("/", "\\/")}`));
});
