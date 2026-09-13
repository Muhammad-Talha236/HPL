# Club Registration Process

## 1. Overview

A **Club Registration** allows a Normal User to apply to create and manage a football club on the platform.

The club must be reviewed and approved by the **Super Admin** before it becomes active.

---

## 2. Registration Flow

```text
Normal User
    ↓
Register a Club
    ↓
Enter Club Information
    ↓
Submit Application
    ↓
Status: Pending
    ↓
Super Admin Review
    ↓
 ┌───────────────┐
 │               │
Approve        Reject
 │               │
 ↓               ↓
Club Created   Application Rejected
 │
 ↓
User becomes Club Admin
 │
 ↓
Club Portal Activated
```

---

## 3. Club Registration Information

The Normal User provides basic information about the club.

### Club Information

* Club name
* Club logo
* Club description
* Region
* District/City
* Contact information

### Club Representative

* Name
* Contact information

Only necessary information should be collected during registration.

---

## 4. Registration Status

The club registration can have the following statuses:

```text
Pending
Approved
Rejected
Suspended
```

### Pending

The application has been submitted and is waiting for Super Admin review.

### Approved

The club has been approved and the user becomes the Club Admin.

### Rejected

The application has been rejected by the Super Admin.

### Suspended

An approved club has been temporarily disabled by the Super Admin.

---

## 5. Super Admin Review

After submission, the Super Admin reviews the club application.

The Super Admin can:

* View the application
* Review club information
* Approve the club
* Reject the club

If rejected, the application should contain a rejection reason.

---

## 6. After Approval

After the club is approved:

```text
Normal User
     ↓
Club Admin
     ↓
Club Portal
     ↓
Manage Club
     ↓
Create/Register Teams
```

The user's original account remains the same. The user simply receives **Club Admin permissions** for the approved club.

---

## 7. Club and Team Registration

Club registration does not automatically create a team.

These are separate processes:

```text
Club Registration
       ↓
Club Approved
       ↓
Team Registration
       ↓
Team Approved
       ↓
Competition Registration
       ↓
Competition Approved
```

For example:

```text
Hunza United FC
       ↓
Men's Team
       ↓
Northern League 2026
```

The club must first have an approved club and team before registering that team for a competition.

---

## 8. Club Portal Access

After approval, the Club Admin can access the Club Portal.

The Club Admin can:

* Manage club profile
* Register teams
* Manage club teams
* Manage players
* View competitions
* View fixtures and results
* View statistics

The Club Admin can only manage their own club and its related teams.

---

## 9. Club Registration Summary

```text
                    Club Registration
                           │
                    Normal User
                           │
                           ↓
                  Submit Club Application
                           │
                           ↓
                        Pending
                           │
                           ↓
                    Super Admin Review
                           │
                  ┌────────┴────────┐
                  ↓                 ↓
              Approved           Rejected
                  │
                  ↓
            Club is Created
                  │
                  ↓
          User becomes Club Admin
                  │
                  ↓
            Club Portal Access
                  │
                  ↓
            Register/Create Teams
                  │
                  ↓
        Register Teams for Competitions
```

> **Note:** Club Registration, Team Registration, and Competition Registration are separate processes. Approval of a club does not automatically approve its teams or competition participation.
