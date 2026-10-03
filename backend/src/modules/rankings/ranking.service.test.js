import test from "node:test";
import assert from "node:assert/strict";

import { calculateEloRankings } from "./ranking.service.js";

const team = (gender) => ({ gender });

const match = ({
  match_id,
  home_team_id,
  away_team_id,
  home_score,
  away_score,
  gender = "MEN",
}) => ({
  match_id,
  home_team_id,
  away_team_id,
  home_score,
  away_score,
  competition: { gender },
  home_team: team(gender),
  away_team: team(gender),
});

test("ELO V1 awards 16 rating points for a win between new equal teams", () => {
  const rankings = calculateEloRankings([
    match({ match_id: 10, home_team_id: 1, away_team_id: 2, home_score: 3, away_score: 1 }),
  ]);

  assert.deepEqual(rankings, [
    { team_id: 1, gender: "MEN", rating: 1516, rank: 1, matches_counted: 1, wins: 1, draws: 0, losses: 0, last_match_id: 10 },
    { team_id: 2, gender: "MEN", rating: 1484, rank: 2, matches_counted: 1, wins: 0, draws: 0, losses: 1, last_match_id: 10 },
  ]);
});

test("ELO V1 is deterministic and maintains gender-separated pools", () => {
  const history = [
    match({ match_id: 1, home_team_id: 1, away_team_id: 2, home_score: 0, away_score: 0 }),
    match({ match_id: 2, home_team_id: 3, away_team_id: 4, home_score: 2, away_score: 0, gender: "WOMEN" }),
  ];

  const first = calculateEloRankings(history);
  const second = calculateEloRankings(history);

  assert.deepEqual(first, second);
  assert.equal(first.filter((entry) => entry.gender === "MEN")[0].rating, 1500);
  assert.deepEqual(first.filter((entry) => entry.gender === "WOMEN").map((entry) => entry.rank), [1, 2]);
});
