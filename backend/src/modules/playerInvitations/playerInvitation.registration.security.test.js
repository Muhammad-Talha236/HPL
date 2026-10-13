import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { fixture, response } from "./playerInvitation.testSupport.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { registerPlayerInvitationAccountValidation } from "./playerInvitation.validation.js";

test("invitation registration rejects email, role, player ID and status mass assignment",async()=>{
 const req={body:{name:"Amin Khan",password:"Secure!123",confirm_password:"Secure!123",email:"attacker@example.com",role:"SUPER_ADMIN",player_id:100,status:"ACTIVE"}};for(const chain of registerPlayerInvitationAccountValidation)await chain.run(req);assert.equal(validationResult(req).isEmpty(),false);
});
test("concurrent invitation registrations create one account but no Player or roster row",async()=>{
 const f=await fixture();await f.send("new@example.com");const req={params:{token:f.mail[0].rawToken},body:{name:"Amin Khan",password:"Secure!123",confirm_password:"Secure!123"}};const a=response(),b=response();await Promise.all([f.controllers.registerPlayerInvitationAccount(req,a),f.controllers.registerPlayerInvitationAccount(req,b)]);assert.deepEqual([a.statusCode,b.statusCode].sort(),[201,409]);assert.equal(f.state.users.length,3);assert.equal(f.state.players.length,1);assert.equal(f.state.memberships.length,1);assert.equal(f.state.invitations[0].status,"PENDING");assert.equal(await bcrypt.compare("Secure!123",f.state.users[2].password_hash),true);
});
test("existing-account setup never overwrites name, password, role or verification data",async()=>{
 const f=await fixture();const old={...f.state.users[1],password_hash:"existing-hash"};Object.assign(f.state.users[1],old);await f.send();const r=response();await f.controllers.registerPlayerInvitationAccount({params:{token:f.mail[0].rawToken},body:{name:"New Name",password:"Other!123",confirm_password:"Other!123"}},r);assert.equal(r.statusCode,409);assert.deepEqual(f.state.users[1],old);
});
