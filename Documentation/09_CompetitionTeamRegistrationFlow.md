# Competition Team Registration Process

## 1. Overview

Competition Registration allows an approved team to apply for participation in a specific competition.

Team registration on the platform and competition registration are separate processes.

A team must already exist and be approved before it can register for a competition.

Each competition can have its own registration fee, eligibility rules, registration dates, and squad requirements.

---

## 2. Requirements

Before registering for a competition:

* Team must be approved and active.
* Team must not already be registered for the same competition.
* Competition must be open for registration.
* Team must meet the competition eligibility requirements.
* Required players and squad information must be provided.
* Registration fee must be paid if the competition has a fee.

---

## 3. Competition Registration Flow

```text
Approved Team
      ↓
Team Portal
      ↓
Available Competitions
      ↓
Select Competition
      ↓
View Competition Details
      ↓
Check Eligibility & Fee
      ↓
Confirm Team & Squad
      ↓
Pay Registration Fee
      ↓
Payment Verification
      ↓
Submit Registration
      ↓
Super Admin Review
      ↓
Approve / Reject
      ↓
Team Registered in Competition
```

---

## 4. Competition Details

Before registering, the Team Owner/Manager can view:

* Competition Name
* Gender
* Season
* Registration Fee
* Registration Start Date
* Registration Deadline
* Competition Start Date
* Competition End Date
* Venue/Locations
* Maximum Teams
* Squad Requirements
* Player Eligibility Rules
* Competition Format
* Refund Policy
* Competition Status

This allows the team to understand the competition before paying the registration fee.

---

## 5. Team & Squad Confirmation

Before payment, the Team Owner/Manager confirms:

* Team information
* Team representative
* Team contact information
* Competition
* Player squad
* Required player information
* Eligibility requirements

The system should validate the squad according to the competition rules.

Example:

```text
Competition:
Northern Premier League 2026

Required Squad:
Minimum: 15 players
Maximum: 25 players

Team Squad:
20 players

Status:
Eligible
```

---

## 6. Registration Fee

Each competition can define its own registration fee.

Example:

```text
Competition Fee: PKR 10,000

Registration Fee
        ↓
Payment
        ↓
Payment Successful
        ↓
Payment Status = Paid
```

The fee should be stored against the **competition registration**, not permanently against the team.

A team may participate in different competitions with different registration fees.

---

## 7. Payment Status

Payment should have its own status:

```text
Unpaid
Pending
Paid
Failed
Refunded
```

The system should also store the payment/transaction reference for verification.

Example:

```text
Registration:
Northern Premier League 2026

Fee:
PKR 10,000

Payment Status:
Paid

Transaction Reference:
TXN-XXXXXX
```

---

## 8. Registration Status

Competition registration should have a separate status:

```text
Pending
Approved
Rejected
Cancelled
```

Payment status and registration status should not be combined.

For example:

```text
Payment Status: Paid
Registration Status: Pending
```

This means the team has successfully paid but Super Admin has not approved the registration yet.

---

## 9. Super Admin Review

After payment and submission, Super Admin reviews the competition registration.

Super Admin can:

* View team information.
* View registered players.
* Check player eligibility.
* Verify payment.
* Review required documents.
* Approve registration.
* Reject registration.
* Provide rejection reason.
* Handle refund according to the competition refund policy.

---

## 10. After Approval

Once approved:

* Team becomes an official participant in the competition.
* Team appears in the competition's participating teams.
* Team becomes eligible for fixtures.
* Team appears in competition standings after matches.
* Registered players become associated with the competition.
* Team can view competition fixtures, results, standings, and statistics.

---

## 11. Rejection & Refund

If a registration is rejected after payment, the system should follow the competition's refund policy.

Example:

```text
Payment
   ↓
Paid
   ↓
Registration Rejected
   ↓
Check Refund Policy
   ↓
Refund Eligible?
   ├── Yes → Refund → Payment Status = Refunded
   └── No  → Payment remains Paid
```

The refund decision should be based on the competition's defined policy rather than being automatically assumed.

---

## 12. Club-Owned & Independent Teams

Both types of teams use the same competition registration process.

### Club-Owned Team

```text
Club
 ↓
Team
 ↓
Team Portal
 ↓
Competition Registration
 ↓
Payment
 ↓
Super Admin Approval
```

### Independent Team

```text
Team Owner
 ↓
Independent Team
 ↓
Team Portal
 ↓
Competition Registration
 ↓
Payment
 ↓
Super Admin Approval
```

Once approved for the competition, both teams are treated equally as competition participants.

---

## 13. Complete Flow

```text
Approved Team
      ↓
Available Competition
      ↓
Select Competition
      ↓
View Rules & Registration Fee
      ↓
Confirm Squad
      ↓
Pay Registration Fee
      ↓
Payment Successful
      ↓
Submit Competition Registration
      ↓
Super Admin Review
      ↓
 ┌───────────────┐
 │               │
Approve        Reject
 │               │
 ↓               ↓
Official       Refund
Participant    if eligible
 │
 ↓
Fixtures & Competition
```

## 14. Key Rules

* Team must be approved before competition registration.
* Competition registration is separate from team creation.
* Each competition can have its own registration fee.
* Payment status and registration status must be tracked separately.
* Payment does not automatically mean competition approval.
* Super Admin approves the final competition registration.
* Both club-owned and independent teams follow the same competition registration process.
* Refunds depend on the competition's refund policy.
