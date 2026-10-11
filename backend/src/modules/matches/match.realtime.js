let io = null;

const roomFor = (matchId) => `match:${matchId}`;
const matchIdFrom = (value) => {
  const matchId = Number(value);
  return Number.isInteger(matchId) && matchId > 0 ? matchId : null;
};

// Public sockets are deliberately read-only. Match changes continue to use the
// existing authenticated REST endpoints, where the established RBAC, referee
// assignment, transaction and audit checks are enforced.
export const configureMatchRealtime = (socketServer) => {
  io = socketServer;
  socketServer.on("connection", (socket) => {
    socket.on("match:subscribe", (payload = {}, acknowledge) => {
      const matchId = matchIdFrom(payload.match_id);
      if (!matchId) {
        acknowledge?.({ success: false, message: "match_id must be a positive integer" });
        return;
      }
      socket.join(roomFor(matchId));
      acknowledge?.({ success: true, data: { match_id: matchId } });
    });
  });
};

export const broadcastMatchChange = (matchIdValue, change) => {
  const matchId = matchIdFrom(matchIdValue);
  if (!io || !matchId) return;
  io.to(roomFor(matchId)).emit("match:changed", {
    match_id: matchId,
    change,
    occurred_at: new Date().toISOString(),
  });
};

