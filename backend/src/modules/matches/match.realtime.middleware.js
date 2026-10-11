import { broadcastMatchChange } from "./match.realtime.js";

const matchIdFrom = (...values) => {
  for (const value of values) {
    const matchId = Number(value);
    if (Number.isInteger(matchId) && matchId > 0) return matchId;
  }
  return null;
};

// This middleware observes only successful REST responses. Controllers call
// res.json after their database transaction has completed, so notifications
// cannot announce an uncommitted or rejected match mutation.
export const broadcastSuccessfulMatchChange = (change) => (req, res, next) => {
  const sendJson = res.json.bind(res);
  let responseBody = null;
  res.json = (body) => {
    responseBody = body;
    return sendJson(body);
  };
  res.once("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300 || !responseBody?.success) return;
    const matchId = matchIdFrom(
      req.params?.match_id,
      req.body?.match_id,
      responseBody?.match_id,
      responseBody?.data?.match_id,
      responseBody?.data?.match?.match_id,
      responseBody?.data?.event?.match_id,
      responseBody?.data?.match_player?.match_id,
    );
    if (matchId) broadcastMatchChange(matchId, change);
  });
  next();
};

