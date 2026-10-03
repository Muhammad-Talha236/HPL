export const INITIAL_RATING = 1500;
export const K_FACTOR = 32;
export const RANKING_GENDERS = ["MEN", "WOMEN"];

const roundRating = (rating) => Math.round(rating * 100) / 100;

const expectedScore = (ownRating, opponentRating) =>
  1 / (1 + 10 ** ((opponentRating - ownRating) / 400));

const actualScore = (ownScore, opponentScore) => {
  if (ownScore > opponentScore) return 1;
  if (ownScore < opponentScore) return 0;
  return 0.5;
};

const createTeamState = (teamId, gender) => ({
  team_id: teamId,
  gender,
  rating: INITIAL_RATING,
  matches_counted: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  last_match_id: null,
});

const applyResult = (state, score, opponentScore, matchId) => {
  state.matches_counted += 1;
  state.last_match_id = matchId;
  if (score > opponentScore) state.wins += 1;
  else if (score < opponentScore) state.losses += 1;
  else state.draws += 1;
};

// Pure, deterministic Elo calculation used by both the transactional rebuild
// and the Node test suite. Input must already be in chronological order.
export const calculateEloRankings = (matches) => {
  const pools = new Map();

  matches.forEach((match) => {
    const gender = match.competition?.gender;
    if (!RANKING_GENDERS.includes(gender)) return;
    if (match.home_team?.gender !== gender || match.away_team?.gender !== gender) return;

    const pool = pools.get(gender) || new Map();
    const home = pool.get(match.home_team_id) || createTeamState(match.home_team_id, gender);
    const away = pool.get(match.away_team_id) || createTeamState(match.away_team_id, gender);
    const homeScore = Number(match.home_score);
    const awayScore = Number(match.away_score);
    const homeExpected = expectedScore(home.rating, away.rating);
    const awayExpected = expectedScore(away.rating, home.rating);
    const homeActual = actualScore(homeScore, awayScore);
    const awayActual = actualScore(awayScore, homeScore);

    home.rating = roundRating(home.rating + K_FACTOR * (homeActual - homeExpected));
    away.rating = roundRating(away.rating + K_FACTOR * (awayActual - awayExpected));
    applyResult(home, homeScore, awayScore, match.match_id);
    applyResult(away, awayScore, homeScore, match.match_id);
    pool.set(home.team_id, home);
    pool.set(away.team_id, away);
    pools.set(gender, pool);
  });

  return [...pools.values()].flatMap((pool) => [...pool.values()]).sort((first, second) => {
    if (first.gender !== second.gender) return first.gender.localeCompare(second.gender);
    if (second.rating !== first.rating) return second.rating - first.rating;
    if (second.matches_counted !== first.matches_counted) return second.matches_counted - first.matches_counted;
    return first.team_id - second.team_id;
  }).map((ranking, index, values) => ({
    ...ranking,
    rank: 1 + values.slice(0, index).filter((previous) => previous.gender === ranking.gender).length,
  }));
};

export const recalculateTeamRankings = async (tx) => {
  const matches = await tx.match.findMany({
    where: { status: "COMPLETED", competition: { gender: { in: RANKING_GENDERS } } },
    select: {
      match_id: true,
      home_team_id: true,
      away_team_id: true,
      home_score: true,
      away_score: true,
      match_date: true,
      start_time: true,
      competition: { select: { gender: true } },
      home_team: { select: { gender: true } },
      away_team: { select: { gender: true } },
    },
    orderBy: [{ match_date: "asc" }, { start_time: "asc" }, { match_id: "asc" }],
  });

  const rankings = calculateEloRankings(matches);
  await tx.teamRanking.deleteMany();
  if (rankings.length) await tx.teamRanking.createMany({ data: rankings });
  return rankings;
};
