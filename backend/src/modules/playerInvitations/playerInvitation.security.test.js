import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { fixture, response } from "./playerInvitation.testSupport.js";
import { createPlayerInvitationToken, hashPlayerInvitationToken, getPlayerInvitationExpiry } from "../../utils/playerInvitationToken.util.js";

test("tokens remain 256-bit random SHA-256 credentials with a seven-day expiration", () => {
 const a=createPlayerInvitationToken(),b=createPlayerInvitationToken(); assert.equal(a.rawToken.length,43); assert.notEqual(a.rawToken,b.rawToken); assert.equal(a.tokenHash,hashPlayerInvitationToken(a.rawToken)); assert.notEqual(a.rawToken,a.tokenHash); const now=new Date(); assert.equal(getPlayerInvitationExpiry(now)-now,7*86400000);
});
test("authorized team, club and admin senders preserve exact ownership and email-only onboarding", async () => {
 for(const role of ["TEAM_OWNER","CLUB_OWNER","SUPER_ADMIN"]) { const f=await fixture(); f.owner().role=role; if(role==="CLUB_OWNER") {f.state.teams[0].club_id=2; f.state.teams[0].club={owner_id:7,status:"ACTIVE",name:"Hunza Club"};} if(role==="SUPER_ADMIN") f.state.teams[0].owner_id=999; const r=await f.send(); assert.equal(r.statusCode,202);assert.equal(f.mail.length,1);assert.equal(f.state.memberships.length,1); }
});
test("inactive actor, inactive club and expired provisional-team deadline prevent invitations", async () => {
 for(const mode of ["actor","club","deadline"]) {const f=await fixture();if(mode==="actor")f.owner().status="BLOCKED";if(mode==="club"){f.state.teams[0].club_id=2;f.state.teams[0].club={status:"INACTIVE"};}if(mode==="deadline")f.state.teams[0].registration_request={squad_deadline:new Date(0)};const r=await f.send();assert.ok([404,409].includes(r.statusCode));assert.equal(f.state.invitations.length,0);}
});
test("history is scoped and bounded and omits raw tokens, hashes and account metadata", async () => {
 const f=await fixture(); await f.send(); f.state.teams.push({team_id:2,owner_id:888,name:"Foreign Team"}); f.state.invitations.push({...f.state.invitations[0],invitation_id:2,team_id:2});const r=response();await f.controllers.getPlayerInvitations({user:f.owner(),query:{page:1,limit:1}},r);assert.equal(r.body.data.length,1);assert.equal(r.body.pagination.total,1);assert.equal(r.body.data[0].team_id,1);assert.doesNotMatch(JSON.stringify(r.body),/token_hash|rawToken|password_hash|accepted_email_snapshot/);
});
