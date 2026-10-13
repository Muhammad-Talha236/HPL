import "dotenv/config";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { getEmailLookupKey } from "../../utils/email.util.js";
import { createPlayerInvitationControllers } from "./playerInvitation.controller.js";

export const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
export const clone = value => structuredClone(value);
const matches = (record, where = {}) => Object.entries(where).every(([key, value]) => {
  if (key === "OR") return value.some(w => matches(record, w));
  if (key === "AND") return value.every(w => matches(record, w));
  if (key === "NOT") return !matches(record, value);
  if (key === "team_id_player_id") return matches(record, value);
  const actual = record?.[key];
  if (value && typeof value === "object" && !(value instanceof Date)) {
    if ("in" in value) return value.in.includes(actual);
    if ("not" in value) return actual !== value.not;
    if ("gt" in value) return actual > value.gt;
    if ("lte" in value) return actual <= value.lte;
    return matches(actual, value);
  }
  return actual === value;
});
const projection = (record, select) => !record ? null : !select ? record : Object.fromEntries(Object.entries(select).filter(([, v]) => v).map(([key, value]) => [key, value === true ? record[key] : Array.isArray(record[key]) ? record[key].map(r => projection(r, value.select)) : projection(record[key], value.select)]));

export async function fixture({ failMail = false } = {}) {
  let state = {
    users: [{ user_id: 7, name: "Owner", email: "owner@example.com", email_key: "owner@example.com", role: "TEAM_OWNER", status: "ACTIVE", email_verified: false }, { user_id: 9, name: "Existing User", email: "mian.talha@gmail.com", email_key: "miantalha@gmail.com", role: "USER", status: "ACTIVE", email_verified: false }],
    teams: [{ team_id: 1, name: "Hunza FC", owner_id: 7, gender: "MEN", status: "ACTIVE", verification_status: "PROVISIONAL", club_id: null }],
    players: [{ player_id: 100, name: "Legacy Player", date_of_birth: new Date("2000-01-01"), gender: "MALE", position: "Forward", status: "ACTIVE", user_id: null, profile_completed_at: new Date("2025-01-01") }],
    memberships: [{ team_player_id: 100, team_id: 1, player_id: 100, status: "ACTIVE", joined_at: new Date("2025-01-01"), jersey_number: 10 }], invitations: [], audits: [],
  };
  const mail = [];
  let failAudit = false, tail = Promise.resolve();
  const expand = (table, r) => {
    if (!r) return null;
    if (table === "users") return { ...r, player: state.players.find(p => p.user_id === r.user_id) || null };
    if (table === "invitations") return { ...r, team: state.teams.find(t => t.team_id === r.team_id), player: state.players.find(p => p.player_id === r.player_id) || null };
    if (table === "memberships") { const p = state.players.find(p => p.player_id === r.player_id); return { ...r, player: p && { ...p, user: state.users.find(u => u.user_id === p.user_id) || null }, team: state.teams.find(t => t.team_id === r.team_id) }; }
    if (table === "players") return { ...r, team_players: state.memberships.filter(m => m.player_id === r.player_id).map(m => ({ ...m, team: state.teams.find(t => t.team_id === m.team_id) })), competition_players: [], match_players: [] };
    return r;
  };
  const model = (table, idField) => ({
    findUnique: async ({ where, select }) => projection(expand(table, state[table].find(r => matches(expand(table, r), where))), select),
    findFirst: async ({ where, select }) => projection(expand(table, state[table].find(r => matches(expand(table, r), where))), select),
    findMany: async ({ where, select, skip = 0, take = 100 } = {}) => state[table].filter(r => matches(expand(table, r), where)).slice(skip, skip + take).map(r => projection(expand(table, r), select)),
    count: async ({ where } = {}) => state[table].filter(r => matches(expand(table, r), where)).length,
    create: async ({ data, select }) => {
      if (table === "users" && state.users.some(u => u.email_key === getEmailLookupKey(data.email))) throw Object.assign(new Error("Unique identity"), { code: "P2002" });
      const row = { [idField]: Math.max(0, ...state[table].map(r => r[idField])) + 1, created_at: new Date(), updated_at: new Date(), ...clone(data) };
      if (table === "invitations") { row.invited_email_key = getEmailLookupKey(data.invited_email); row.delivered_at = null; }
      if (table === "users") row.email_key = getEmailLookupKey(data.email);
      state[table].push(row); return projection(expand(table, row), select);
    },
    updateMany: async ({ where, data }) => { const rows = state[table].filter(r => matches(expand(table, r), where)); rows.forEach(r => Object.assign(r, clone(data))); return { count: rows.length }; },
    update: async ({ where, data }) => { const r = state[table].find(r => matches(expand(table, r), where)); assert.ok(r); Object.assign(r, clone(data)); return expand(table, r); },
  });
  const db = { user: model("users", "user_id"), team: model("teams", "team_id"), player: model("players", "player_id"), teamPlayer: model("memberships", "team_player_id"), playerInvitation: model("invitations", "invitation_id"), $queryRaw: async (strings, ...values) => {
      const sql = strings.join("?");
      if (sql.includes('FROM "Team" t')) {
        const team = state.teams.find(t => t.team_id === values[0]);
        return team ? [{ ...clone(team), club_owner_id: team.club?.owner_id, club_status: team.club?.status, club_name: team.club?.name, squad_deadline: team.registration_request?.squad_deadline }] : [];
      }
      if (sql.includes('FROM "User" u')) {
        const user = state.users.find(u => u.user_id === values[0]);
        return user ? [{ ...clone(user), linked_player_id: state.players.find(p => p.user_id === user.user_id)?.player_id || null }] : [];
      }
      if (sql.includes('FROM "Player"')) { const player = state.players.find(p => p.player_id === values[0]); return player ? [clone(player)] : []; }
      return [];
    }, auditLog: { create: async ({ data }) => { if (failAudit) throw new Error("AUDIT_FAILED"); state.audits.push(data); return data; } },
    $transaction: async fn => { const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous; const before = clone(state); try { return await fn(db); } catch (err) { state = before; throw err; } finally { release(); } },
  };
  const controllers = createPlayerInvitationControllers(db, async value => { if (failMail) throw new Error("Provider secret must not leak"); mail.push(value); });
  const owner = () => state.users[0];
  const send = async (email = "mian.talha@gmail.com", extra = {}) => { const r = response(); await controllers.createPlayerInvitation({ user: owner(), body: { team_id: 1, invited_email: email, ...extra } }, r); return r; };
  const accept = async (userId = 9, token = mail[0]?.rawToken) => { const r = response(); await controllers.acceptPlayerInvitation({ user: { user_id: userId }, params: { token } }, r); return r; };
  const profile = async (userId = 9, invitationId = state.invitations[0]?.invitation_id, fields = {}) => { const r = response(); await controllers.completePlayerProfile({ user: { user_id: userId }, params: { invitation_id: invitationId }, body: { name: "Player Name", date_of_birth: "2000-01-01", gender: "MALE", position: "Midfielder", ...fields } }, r); return r; };
  return { db, mail, controllers, send, accept, profile, owner, get state() { return state; }, set failAudit(value) { failAudit = value; }, set mailFailure(value) { failMail = value; } };
}

export const patchDb = db => {
  const restores = [];
  for (const [modelName, mock] of Object.entries(db)) {
    if (modelName.startsWith("$")) { const old = prisma[modelName]; prisma[modelName] = mock; restores.push(() => { prisma[modelName] = old; }); }
    else for (const [method, implementation] of Object.entries(mock)) { const old = prisma[modelName][method]; prisma[modelName][method] = implementation; restores.push(() => { prisma[modelName][method] = old; }); }
  }
  return () => restores.reverse().forEach(restore => restore());
};
