# Normal Team Registration Process

## 1. Overview

A Normal User can register an independent football team without being associated with an existing club.

Since the team is not connected to an already-approved club, the Super Admin must review and approve the team registration.

After approval, the user becomes the **Team Owner/Manager** for that team and gets access to the Team Portal.

---

## 2. Requirements

Before registering a team:

* User must have a registered account.
* User must be an active Normal User.
* User must not already have an identical team registration.
* Team must not already exist on the platform.

---

## 3. Registration Flow

```text
Normal User
      ↓
Register Team
      ↓
Enter Team Information
      ↓
Add Team Players
      ↓
Submit Registration
      ↓
Pending
      ↓
Super Admin Review
      ↓
Approve / Reject
      ↓
Team Created
      ↓
Team Owner/Manager Access
      ↓
Team Portal
```

---

## 4. Team Information

The user provides:

* Team Name
* Team Logo
* Gender
* Region
* District/City
* Home Venue
* Team Description
* Contact Information

### Gender

The team must be identified as:

* Men's
* Women's

This allows the platform to maintain separate men's and women's football data.

---

## 5. Team Player Information

The user can add the initial team squad during registration.

Each player can have:

* Full Name
* Profile Photo
* Date of Birth
* Gender
* Position
* Jersey Number
* Contact Information
* Nationality
* Player Registration/ID Number
* Previous Club/Team
* Player Status

### Player Status

Example:

* Active
* Inactive
* Suspended
* Transferred

The initial player list can be submitted along with the team registration.

---

## 6. Super Admin Review

After submission, the registration status becomes:

**Pending**

Super Admin can:

* View team information.
* Review team owner information.
* Review team players.
* Check for duplicate teams.
* Approve the registration.
* Reject the registration.
* Provide a rejection reason.

### Registration Status

```text
Pending
Approved
Rejected
Suspended
```

---

## 7. After Approval

Once the Super Admin approves the registration:

* Team is officially created.
* Team is marked as an Independent Team.
* The registering user becomes the Team Owner/Manager.
* Team Portal becomes available.
* User can manage the team's information.
* User can manage team players.
* User can apply for competitions.

The user's global account remains a **Normal User**.

Only the permissions for the approved team are added.

---

## 8. Team Ownership

An independent team has no parent club.

Example:

```text
Normal User
     ↓
Team Owner/Manager
     ↓
Hunza Eagles FC
     ↓
Team Portal
```

The Team Owner/Manager can manage only their own team.

They cannot manage other teams or clubs.

---

## 9. Competition Registration

Creating an independent team does **not** automatically register it for a competition.

After team approval:

```text
Team Approved
      ↓
Team Portal
      ↓
Available Competitions
      ↓
Select Competition
      ↓
Submit Competition Registration
      ↓
Super Admin Review
      ↓
Competition Approved
```

Competition approval is separate from team approval.

---

## 10. Team Owner/Manager Permissions

The Team Owner/Manager can:

* View and update team profile.
* Manage team players.
* Add/remove players.
* Update player information.
* View fixtures and results.
* View standings and statistics.
* Register the team for competitions.
* View competition registration status.

The Team Owner/Manager cannot:

* Manage other teams.
* Manage clubs.
* Create official league matches.
* Modify standings.
* Approve players for other teams.
* Manage competitions.
* Access Super Admin settings.

---

## 11. Club-Owned vs Independent Team

| Feature                  | Club-Owned Team | Independent Team     |
| ------------------------ | --------------- | -------------------- |
| Created by               | Club Admin      | Normal User          |
| Parent Club              | Yes             | No                   |
| Team Approval            | Not required    | Super Admin required |
| Manager                  | Club Admin      | Team Owner/Manager   |
| Team Portal              | Yes             | Yes                  |
| Competition Registration | Required        | Required             |
| Competition Approval     | Super Admin     | Super Admin          |

---

## 12. Summary

```text
Normal User
      ↓
Register Independent Team
      ↓
Enter Team Details
      ↓
Add Players
      ↓
Submit
      ↓
Super Admin Approval
      ↓
Team Created
      ↓
Team Owner/Manager
      ↓
Team Portal
      ↓
Competition Registration
      ↓
Competition Approval
```

**Key Rule:**

> An approved Club can create its own teams without separate team approval.
> An independent team registered by a Normal User requires Super Admin approval because the team is not backed by an already-approved Club.
