import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socketOrigin = () => (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

// Sockets only announce a committed match change. Views refresh through their
// existing REST endpoint, so socket payloads never overwrite authoritative data.
export const useMatchRealtime = (matchId, onChange) => {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const numericMatchId = Number(matchId);
    if (!Number.isInteger(numericMatchId) || numericMatchId < 1) {
      setStatus("offline");
      return undefined;
    }
    const socket = io(socketOrigin() || undefined, { transports: ["websocket", "polling"], reconnection: true });
    const subscribe = () => {
      setStatus("connected");
      socket.emit("match:subscribe", { match_id: numericMatchId });
    };
    const refresh = (event) => {
      if (Number(event?.match_id) === numericMatchId) onChange();
    };
    socket.on("connect", subscribe);
    socket.on("disconnect", () => setStatus("reconnecting"));
    socket.on("connect_error", () => setStatus("reconnecting"));
    socket.on("match:changed", refresh);
    return () => socket.disconnect();
  }, [matchId, onChange]);

  return status;
};
