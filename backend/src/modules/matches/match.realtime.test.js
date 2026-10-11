import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as socketClient } from "socket.io-client";
import { broadcastMatchChange, configureMatchRealtime } from "./match.realtime.js";
import { broadcastSuccessfulMatchChange } from "./match.realtime.middleware.js";

const fakeIo = () => {
  const handlers = {};
  const emitted = [];
  return {
    handlers,
    emitted,
    on(event, handler) { handlers[event] = handler; },
    to(room) { return { emit(event, payload) { emitted.push({ room, event, payload }); } }; },
  };
};

test("public match rooms accept only a positive match id and emit no write handlers", () => {
  const io = fakeIo();
  configureMatchRealtime(io);
  const handlers = {};
  const joined = [];
  io.handlers.connection({ on(event, handler) { handlers[event] = handler; }, join(room) { joined.push(room); } });
  let acknowledgement;
  handlers["match:subscribe"]({ match_id: "22" }, (response) => { acknowledgement = response; });
  assert.deepEqual(joined, ["match:22"]);
  assert.deepEqual(acknowledgement, { success: true, data: { match_id: 22 } });
  assert.deepEqual(Object.keys(handlers), ["match:subscribe"]);
  broadcastMatchChange(22, "event-created");
  assert.equal(io.emitted[0].room, "match:22");
  assert.equal(io.emitted[0].event, "match:changed");
});

test("a real Socket.IO client receives only its subscribed match refresh", async (t) => {
  const server = http.createServer();
  const io = new SocketIOServer(server, { cors: { origin: true } });
  configureMatchRealtime(io);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const client = socketClient(`http://127.0.0.1:${port}`, { transports: ["websocket"], forceNew: true });
  t.after(() => new Promise((resolve) => { client.close(); io.close(() => server.close(resolve)); }));
  await new Promise((resolve, reject) => { client.once("connect", resolve); client.once("connect_error", reject); });
  const subscription = await new Promise((resolve) => client.emit("match:subscribe", { match_id: 42 }, resolve));
  assert.equal(subscription.success, true);
  const changed = new Promise((resolve) => client.once("match:changed", resolve));
  broadcastMatchChange(42, "event-created");
  const payload = await changed;
  assert.equal(payload.match_id, 42);
  assert.equal(payload.change, "event-created");
});

test("only successful committed REST responses broadcast a match refresh", () => {
  const io = fakeIo();
  configureMatchRealtime(io);
  const response = new EventEmitter();
  response.statusCode = 201;
  response.json = function json(body) { this.body = body; return this; };
  let continued = false;
  broadcastSuccessfulMatchChange("fixture-created")({ params: {}, body: {} }, response, () => { continued = true; });
  assert.equal(continued, true);
  response.json({ success: true, data: { match: { match_id: 8 } } });
  response.emit("finish");
  assert.equal(io.emitted.length, 1);
  assert.equal(io.emitted[0].payload.match_id, 8);

  const rejected = new EventEmitter();
  rejected.statusCode = 409;
  rejected.json = function json(body) { this.body = body; return this; };
  broadcastSuccessfulMatchChange("event-created")({ params: {}, body: { match_id: 8 } }, rejected, () => {});
  rejected.json({ success: false });
  rejected.emit("finish");
  assert.equal(io.emitted.length, 1);
});
