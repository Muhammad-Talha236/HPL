import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { fixture, response } from "./playerInvitation.testSupport.js";
import { createPlayerInvitationControllers } from "./playerInvitation.controller.js";
import { buildPlayerInvitationEmail, sendPlayerInvitationEmail, setPlayerInvitationMailTransportFactoryForTests, resetPlayerInvitationMailTransportFactoryForTests } from "../../services/playerInvitationMail.service.js";

test("Gmail transport delivers the branded template without persisting plaintext credentials", async () => {
 const before={...process.env};Object.assign(process.env,{EMAIL_USER:"sender@example.com",EMAIL_APP_PASSWORD:"test-only",EMAIL_FROM_NAME:"HPL",FRONTEND_URL:"https://hpl-ten.vercel.app"});let captured;
 setPlayerInvitationMailTransportFactoryForTests(()=>({sendMail:async mail=>{captured=mail;}}));
 try {await sendPlayerInvitationEmail({invitation_id:1,invited_email:"player@example.com",team_name:"Hunza FC",player_name:"there",club_name:"Independent Team",rawToken:"a".repeat(43),expires_at:new Date()});assert.equal(captured.to,"player@example.com");assert.ok(captured.html.includes("Accept Invitation"));assert.ok(captured.text.includes("7 days"));}
 finally{resetPlayerInvitationMailTransportFactoryForTests();for(const k of ["EMAIL_USER","EMAIL_APP_PASSWORD","EMAIL_FROM_NAME","FRONTEND_URL"])if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}
});
test("tokens cannot be previewed or accepted while delivery is in progress", async () => {
 const f=await fixture();let release,entered,mail;const wait=new Promise(r=>{release=r;}),started=new Promise(r=>{entered=r;});const c=createPlayerInvitationControllers(f.db,async value=>{mail=value;entered();await wait;});const r=response();const request=c.createPlayerInvitation({user:f.owner(),body:{team_id:1,invited_email:"mian.talha@gmail.com"}},r);await started;assert.equal(r.statusCode,202);assert.equal(f.state.invitations[0].delivered_at,null);const preview=response();await c.previewPlayerInvitationAcceptance({params:{token:mail.rawToken}},preview);assert.equal(preview.body.data.valid,false);assert.equal((await f.accept(9,mail.rawToken)).statusCode,409);release();await request;assert.equal((await f.accept(9,mail.rawToken)).statusCode,200);
});
test("failed resend revokes the rotated token and does not retain a usable link", async () => {
 const f=await fixture();await f.send();f.state.invitations[0].last_sent_at=new Date(0);f.mailFailure=true;const r=response();await f.controllers.resendPlayerInvitation({user:f.owner(),params:{invitation_id:1}},r);assert.equal(r.statusCode,503);assert.equal(f.state.invitations[0].status,"REVOKED");assert.equal(f.state.invitations[0].delivered_at,null);assert.equal((await f.accept()).statusCode,409);
});
