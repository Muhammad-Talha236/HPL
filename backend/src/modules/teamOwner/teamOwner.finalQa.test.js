import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("final QA: Team Owner API namespace has one role gate and exposes match reads only", async () => {
  const source = await read("./teamOwner.routes.js");
  assert.match(source, /router\.use\(authenticate, authorize\(ROLES\.TEAM_OWNER\)\)/);
  assert.match(source, /router\.get\("\/matches", matches\)/);
  assert.match(source, /router\.get\("\/matches\/:match_id", matchDetail\)/);
  assert.doesNotMatch(source, /router\.(post|put|patch|delete)\("\/matches/);
});

test("final QA: every Team Owner workflow route stays under TeamOwnerLayout, including owned-team detail", async () => {
  const app = await read("../../../../frontend/src/App.jsx");
  const layoutIndex = app.indexOf("<Route element={<TeamOwnerLayout />}>");
  const fallbackIndex = app.indexOf('<Route path="/team/*"');
  assert.ok(layoutIndex >= 0 && fallbackIndex > layoutIndex);
  for (const path of ["/team", "/team/profile", "/team/teams/:teamId", "/team/teams/:teamId/edit", "/team/players", "/team/players/:playerId", "/team/competitions", "/team/registrations", "/team/registrations/:registrationId", "/team/payments", "/team/matches", "/team/matches/:matchId"]) assert.match(app, new RegExp(`path="${path.replace(/[/:]/g, "\\$&")}"`));
});

test("final QA: Team Owner match UI is read-only and derives its timer from authoritative live state", async () => {
  const detail = await read("../../../../frontend/src/features/teamOwner/pages/TeamOwnerMatchDetailPage.jsx");
  const list = await read("../../../../frontend/src/features/teamOwner/pages/TeamOwnerMatchesPage.jsx");
  assert.match(detail, /match\.started_at/);
  assert.match(detail, /setInterval\(\(\) => load\(true\), 30000\)/);
  assert.doesNotMatch(detail, /apiClient\.(post|put|patch|delete)/);
  assert.doesNotMatch(list, /apiClient\.(post|put|patch|delete)/);
});
