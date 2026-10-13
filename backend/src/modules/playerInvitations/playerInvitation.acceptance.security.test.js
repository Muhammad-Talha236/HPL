import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { fixture, response } from "./playerInvitation.testSupport.js";

test("public preview exposes only team, masked mailbox and expiry, never legacy player personal data",async()=>{
 const f=await fixture();f.owner().role="SUPER_ADMIN";await f.send("mian.talha@gmail.com",{player_id:100});const r=response();await f.controllers.previewPlayerInvitationAcceptance({params:{token:f.mail[0].rawToken}},r);assert.equal(r.body.data.valid,true);assert.deepEqual(Object.keys(r.body.data).sort(),["expires_at","invited_email","state","team","valid"]);assert.notEqual(r.body.data.invited_email,"mian.talha@gmail.com");assert.doesNotMatch(JSON.stringify(r.body),/date_of_birth|registration_number|player_id|token_hash/);
});
test("unverified email presence cannot discover pending invitations or linked player data",async()=>{
 const f=await fixture();await f.send();const before=response();await f.controllers.getMyPlayerInvitations({user:{user_id:9}},before);assert.equal(before.body.data.length,0);await f.accept();const after=response();await f.controllers.getMyPlayerInvitations({user:{user_id:9}},after);assert.equal(after.body.data.length,1);assert.equal(after.body.data[0].status,"ACCEPTED");
});
test("changing an accepted email's formatting invalidates the snapshot even if Gmail key stays equal",async()=>{
 const f=await fixture();await f.send();await f.accept();f.state.invitations[0].status="ACCEPTED_PENDING_PROFILE";f.state.users[1].email="miantalha@gmail.com";const r=response();await f.controllers.activateAcceptedInvitation({user:{user_id:9},params:{invitation_id:1}},r);assert.equal(r.statusCode,409);assert.equal(f.state.memberships.length,2);
});
test("decline and acceptance race cannot both consume the invitation",async()=>{
 const f=await fixture();await f.send();const declined=response();const results=await Promise.all([f.accept(),f.controllers.declinePlayerInvitation({params:{token:f.mail[0].rawToken}},declined).then(()=>declined)]);assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);assert.equal(f.state.memberships.length,2);
});
