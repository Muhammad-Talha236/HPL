import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { fixture, response } from "./playerInvitation.testSupport.js";
import { getPlayerInvitationMailConfig } from "../../config/playerInvitationMail.config.js";
import { buildPlayerInvitationEmail } from "../../services/playerInvitationMail.service.js";
import { readFile } from "node:fs/promises";

test("mail configuration and recipient parsing reject header injection",()=>{
 const previous=process.env.EMAIL_FROM_NAME;process.env.EMAIL_FROM_NAME="HPL\r\nBcc: attacker@example.com";assert.throws(()=>getPlayerInvitationMailConfig());if(previous===undefined)delete process.env.EMAIL_FROM_NAME;else process.env.EMAIL_FROM_NAME=previous;assert.throws(()=>buildPlayerInvitationEmail({invited_email:"player@example.com\r\nBcc: attacker@example.com"}));
});
test("recipient cooldown applies across teams and canonical Gmail aliases, including resends",async()=>{
 const f=await fixture();await f.send();f.state.teams.push({...f.state.teams[0],team_id:2,name:"Second Team"});await f.send("miantalha+other@googlemail.com",{team_id:2});assert.equal(f.mail.length,1);f.state.invitations[0].last_sent_at=new Date(0);await f.send("miantalha+other@googlemail.com",{team_id:2});assert.equal(f.mail.length,2);const r=response();await f.controllers.resendPlayerInvitation({user:f.owner(),params:{invitation_id:1}},r);assert.equal(r.statusCode,409);assert.equal(f.mail.length,2);
});
test("a provisional deadline passing before acceptance blocks activation without altering legacy rosters",async()=>{
 const f=await fixture();await f.send();f.state.teams[0].registration_request={squad_deadline:new Date(0)};assert.equal((await f.accept()).statusCode,409);assert.equal(f.state.invitations[0].status,"PENDING");assert.equal(f.state.memberships.length,1);
});
test("additive migration backfills completion without deleting or demoting confirmed data",async()=>{
 const sql=await readFile(new URL("../../../prisma/migrations/20261014000000_invitation_onboarding/migration.sql",import.meta.url),"utf8");assert.match(sql,/profile_completed_at.*created_at/s);assert.match(sql,/ACCEPTED_PENDING_PROFILE/);assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM|SET status='INACTIVE'/i);assert.match(sql,/GENERATED ALWAYS AS/);
});
