import test from "node:test";
import assert from "node:assert/strict";
import { calculateRefereeRankings } from "./referee.ranking.service.js";

test("only referees with five evaluations receive a deterministic ranking", () => {
  const input = [
    ...[8, 8, 8, 8, 8].map((score) => ({ referee_id: 2, score })),
    ...[9, 7, 8, 8, 8].map((score) => ({ referee_id: 1, score })),
    ...[10, 10, 10, 10].map((score) => ({ referee_id: 3, score })),
  ];
  assert.deepEqual(calculateRefereeRankings(input), [
    { referee_id: 1, evaluation_count: 5, rating: 8, position: 1 },
    { referee_id: 2, evaluation_count: 5, rating: 8, position: 2 },
  ]);
});
