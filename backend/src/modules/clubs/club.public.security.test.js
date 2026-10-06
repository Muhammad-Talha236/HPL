import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validationResult } from "express-validator";
import prisma from "../../database/prisma.js";
import { getClubById, getClubs } from "./club.controller.js";
import { publicClubListValidation } from "./club.validation.js";

const response = () => {
  const result = { statusCode: 200, body: null };
  return {
    result,
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
  };
};

const replace = (target, key, value) => {
  const original = target[key];
  target[key] = value;
  return () => { target[key] = original; };
};

const runValidation = async (query) => {
  const request = { query, body: {}, params: {} };
  for (const rule of publicClubListValidation) await rule.run(request);
  return validationResult(request).array();
};

test("public club list is active-only, bounded, filter-scoped, and private-field free", async () => {
  let listQuery;
  let countQuery;
  const restores = [
    replace(prisma.club, "findMany", async (input) => {
      listQuery = input;
      return [{ club_id: 7, name: "Hunza United", logo: null, description: null, region: "Gilgit", district: "Hunza", city: "Karimabad", _count: { teams: 2 } }];
    }),
    replace(prisma.club, "count", async (input) => { countQuery = input; return 13; }),
    replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
  try {
    const res = response();
    await getClubs({ query: { page: 2, limit: 12, search: "Hunza", gender: "MEN", region: "Gilgit", district: "Hunza", city: "Karimabad" } }, res);
    assert.equal(res.result.statusCode, 200);
    assert.equal(listQuery.where.status, "ACTIVE");
    assert.deepEqual(listQuery.where.name, { contains: "Hunza", mode: "insensitive" });
    assert.deepEqual(listQuery.where.teams, { some: { status: "ACTIVE", gender: "MEN" } });
    assert.equal(listQuery.skip, 12);
    assert.equal(listQuery.take, 12);
    assert.deepEqual(listQuery.orderBy, [{ name: "asc" }, { club_id: "asc" }]);
    assert.deepEqual(countQuery.where, listQuery.where);
    assert.equal(res.result.body.data[0].public_team_count, 2);
    assert.deepEqual(res.result.body.pagination, { page: 2, limit: 12, total: 13, total_pages: 2 });
    const projection = JSON.stringify(listQuery.select).toLowerCase();
    for (const field of ["owner_id", "contact_email", "contact_phone", "representative", "password", "token"]) assert.equal(projection.includes(field), false);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("public club detail excludes inactive clubs, bounds relations, and exposes only safe summaries", async () => {
  let detailQuery;
  const matchQueries = [];
  const restores = [
    replace(prisma.club, "findFirst", async (input) => {
      detailQuery = input;
      return {
        club_id: 7,
        name: "Hunza United",
        logo: null,
        description: "Community club",
        region: "Gilgit",
        district: "Hunza",
        city: "Karimabad",
        teams: [{ team_id: 4, name: "Hunza Women", logo: null, gender: "WOMEN", region: null, district: null, city: "Karimabad", description: null, team_type: "SENIOR", home_venue: null }],
      };
    }),
    replace(prisma.match, "findMany", async (input) => { matchQueries.push(input); return []; }),
    replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
  try {
    const res = response();
    await getClubById({ params: { club_id: "7" } }, res);
    assert.equal(res.result.statusCode, 200);
    assert.deepEqual(detailQuery.where, { club_id: 7, status: "ACTIVE" });
    assert.equal(detailQuery.select.teams.where.status, "ACTIVE");
    assert.equal(detailQuery.select.teams.take, 50);
    assert.equal(matchQueries.length, 2);
    for (const query of matchQueries) assert.equal(query.take, 4);
    assert.equal(matchQueries[0].where.OR[0].home_team.club_id, 7);
    assert.equal(matchQueries[1].where.OR[1].away_team.club_id, 7);
    const responseJson = JSON.stringify(res.result.body).toLowerCase();
    for (const field of ["owner_id", "contact_email", "contact_phone", "representative", "password", "token", "referee_id", "match_notes"]) assert.equal(responseJson.includes(field), false);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("inactive or missing public club details are indistinguishable and do not query matches", async () => {
  let queriedMatches = false;
  const restores = [
    replace(prisma.club, "findFirst", async () => null),
    replace(prisma.match, "findMany", async () => { queriedMatches = true; return []; }),
  ];
  try {
    const res = response();
    await getClubById({ params: { club_id: "99" } }, res);
    assert.equal(res.result.statusCode, 404);
    assert.equal(res.result.body.message, "Club not found");
    assert.equal(queriedMatches, false);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("public club query validation rejects malformed, oversized, and injected filters", async () => {
  for (const query of [
    { page: "0" },
    { limit: "25" },
    { gender: "MIXED" },
    { search: "" },
    { unexpected: "value" },
    { region: "x".repeat(101) },
  ]) assert.ok((await runValidation(query)).length > 0, JSON.stringify(query));
  assert.equal((await runValidation({ page: "1", limit: "24", search: "Hunza", gender: "WOMEN", region: "Gilgit" })).length, 0);
});

test("public club routes, shared navigation, and client service keep the directory unauthenticated and server-backed", async () => {
  const [routes, app, navbar, service, listPage, detailsPage] = await Promise.all([
    readFile(new URL("./club.routes.js", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/components/navigation/Navbar.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/clubs/services/clubService.js", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/clubs/pages/ClubsPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/clubs/pages/ClubDetailsPage.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(routes, /router\.get\("\/", publicClubListValidation, handleValidationErrors, getClubs\)/);
  assert.match(app, /path="\/clubs" element=\{<ClubsPage \/>\}/);
  assert.match(app, /path="\/clubs\/:clubId" element=\{<ClubDetailsPage \/>\}/);
  assert.match(navbar, /\{ label: "CLUBS", path: "\/clubs" \}/);
  assert.match(service, /apiClient\.get\("\/clubs", \{ params \}\)/);
  assert.match(service, /apiClient\.get\(`\/clubs\/\$\{clubId\}`\)/);
  assert.match(listPage, /getClubs\(\{ page, limit: 12/);
  assert.match(detailsPage, /<TeamCard key=\{team\.team_id\} team=\{team\} \/>/);
  for (const file of [service, listPage, detailsPage]) assert.equal(file.toLowerCase().includes("localstorage"), false);
});
