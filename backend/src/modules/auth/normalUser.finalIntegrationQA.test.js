import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readFrontend = (path) => readFile(new URL(`../../../../frontend/src/${path}`, import.meta.url), "utf8");

test("public football directories retain the public shell while portal roots remain isolated", async () => {
  const [layout, app, clubLayout] = await Promise.all([
    readFrontend("layouts/PublicLayout.jsx"),
    readFrontend("App.jsx"),
    readFrontend("layouts/ClubOwnerLayout.jsx"),
  ]);

  assert.match(layout, /const isOperationalPortal = \(root\) => pathname === root \|\| pathname\.startsWith\(`\$\{root\}\/`\)/);
  assert.match(layout, /isOperationalPortal\("\/admin"\) \|\| isOperationalPortal\("\/club"\)/);
  assert.equal(layout.includes('pathname.startsWith("/club")'), false);
  assert.equal(layout.includes('pathname.startsWith("/team")'), false);
  for (const path of ["/clubs", "/clubs/:clubId", "/teams", "/teams/:teamId"]) assert.match(app, new RegExp(`path="${path.replaceAll("/", "\\/").replace(":", "\\:")}"`));
  assert.match(clubLayout, /to="\/club\/profile"/);
  assert.equal(clubLayout.includes('to="/account"'), false);
});

test("normal-user account, role gates, and public discovery remain explicitly routed", async () => {
  const [app, accountGate, navbar, footer, authService] = await Promise.all([
    readFrontend("App.jsx"),
    readFrontend("routes/UserAccountRoute.jsx"),
    readFrontend("components/navigation/Navbar.jsx"),
    readFrontend("components/navigation/Footer.jsx"),
    readFrontend("features/auth/services/authService.js"),
  ]);

  for (const path of ["/account", "/account/profile", "/account/password", "/account/notifications"]) assert.match(app, new RegExp(`path="${path.replaceAll("/", "\\/")}"`));
  assert.match(accountGate, /user\?\.role === "USER"/);
  for (const [role, path] of [["CLUB_OWNER", "/club"], ["SUPER_ADMIN", "/admin"], ["REFEREE", "/referee/dashboard"]]) assert.match(accountGate, new RegExp(`${role}: "${path.replaceAll("/", "\\/")}"`));
  for (const path of ["/clubs", "/players", "/competitions", "/matches", "/standings", "/rankings", "/news", "/referees"]) assert.match(footer, new RegExp(`path: "${path.replaceAll("/", "\\/")}"`));
  assert.match(navbar, /user\.role === "USER"[\s\S]{0,260}\/account\/notifications/);
  assert.match(authService, /ME: "\/auth\/me"/);
});

test("core public discovery pages use live services rather than mock football records", async () => {
  const [homeService, clubService, playerService, matchService, teamService] = await Promise.all([
    readFrontend("features/home/services/homeService.js"),
    readFrontend("features/clubs/services/clubService.js"),
    readFrontend("features/players/services/playerService.js"),
    readFrontend("features/matches/services/matchService.js"),
    readFrontend("features/teams/services/teamService.js"),
  ]);
  for (const [source, endpoint] of [[homeService, '"/matches"'], [clubService, '"/clubs"'], [playerService, '"/players"'], [matchService, '"/matches"'], [teamService, '"/teams"']]) assert.equal(source.includes(endpoint), true);
  for (const source of [homeService, clubService, playerService, matchService, teamService]) assert.equal(/\b(mock|fake|fixture)\b/i.test(source), false);
});
