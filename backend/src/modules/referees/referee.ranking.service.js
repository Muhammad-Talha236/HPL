export const MIN_RANKING_EVALUATIONS = 5;
const round = (value) => Math.round(value * 100) / 100;

export const calculateRefereeRankings = (evaluations) => {
  if (!evaluations.length) return [];
  const groups = new Map();
  evaluations.forEach(({ referee_id, score }) => { const values = groups.get(referee_id) || []; values.push(score); groups.set(referee_id, values); });
  return [...groups.entries()].map(([referee_id, scores]) => { const evaluation_count = scores.length; return { referee_id, evaluation_count, rating: round(scores.reduce((sum, score) => sum + score, 0) / evaluation_count) }; }).filter((item) => item.evaluation_count >= MIN_RANKING_EVALUATIONS).sort((a,b) => b.rating - a.rating || b.evaluation_count - a.evaluation_count || a.referee_id - b.referee_id).map((item, index) => ({ ...item, position: index + 1 }));
};

export const rebuildRefereeRankings = async (tx) => { const evaluations = await tx.refereeEvaluation.findMany({ select: { referee_id: true, score: true } }); const rankings = calculateRefereeRankings(evaluations); await tx.refereeRanking.deleteMany(); if (rankings.length) await tx.refereeRanking.createMany({ data: rankings }); return rankings; };
