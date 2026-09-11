# Team Features

## 1. Overview

A **Team** is a football team that participates in competitions and matches.

A team can either:

* Belong to a registered club.
* Operate as an independent team.

Both types of teams can participate in competitions.

```text
Team
│
├── Club-Owned Team
│      └── Belongs to a Club
│
└── Independent Team
       └── Managed by a Team Owner/Manager
```

---

## 2. Team Dashboard

The Team Dashboard provides an overview of the team's current activities.

### Features

* Team information
* Current competition
* Upcoming matches
* Recent results
* Current standings
* Team statistics
* Player summary
* Registration status

---

## 3. Team Profile

The team can manage its basic information.

### Features

* View team profile
* Edit allowed team information
* Update team logo
* Update team description
* View team location
* View team type
* View team status

For a club-owned team, the associated club will also be displayed.

---

## 4. Player Management

The team can manage players who belong to the team.

### Features

* View team players
* Add players
* Remove players
* View player profiles
* Submit player registrations
* View player registration status
* View player statistics

Player registrations may require **Super Admin approval**.

---

## 5. Competition Management

The team can apply to participate in available competitions.

### Features

* View available competitions
* Register for a competition
* View registration status
* View active competitions
* View competition information
* View competition standings
* View competition results

A team can participate in competitions only after the registration is approved.

---

## 6. Matches & Fixtures

The team can view all matches related to its competitions.

### Features

* View upcoming matches
* View previous matches
* View match schedules
* View match venues
* View match results
* View match status

The team cannot directly create league matches. Match scheduling is handled by the **Super Admin**.

---

## 7. Team Statistics

The team can view its performance statistics.

### Features

* Matches played
* Wins
* Draws
* Losses
* Goals scored
* Goals conceded
* Points
* Current position
* Player statistics

---

## 8. Team Registration

A team can be registered in two ways.

### Club-Owned Team

An existing team under a club can apply for a competition.

```text
Club
 ↓
Existing Team
 ↓
Select Competition
 ↓
Submit Registration
 ↓
Super Admin Review
 ↓
Approved
```

### Independent Team

A normal user can create an independent team and apply for a competition.

```text
Normal User
 ↓
Register Team
 ↓
Enter Team Information
 ↓
Select Competition
 ↓
Submit Registration
 ↓
Super Admin Review
 ↓
Approved
 ↓
Team Portal
```

---

## 9. Team Ownership

### Club-Owned Team

A club manages the team through its Club Portal.

```text
Club
 ↓
Club Portal
 ↓
Team
 ↓
Team Activities
```

### Independent Team

The user who registered the team becomes its Team Owner/Manager.

```text
Normal User
 ↓
Team Owner/Manager
 ↓
Team Portal
```

The Team Owner can manage only the team they own.

---

## 10. Men's & Women's Teams

Teams are categorized as either men's or women's teams.

```text
Football
│
├── Men's
│   └── Teams
│
└── Women's
    └── Teams
```

The same Team Portal structure can be used for both categories.

---

## 11. Team Access Restrictions

A team can manage only its own team information and activities.

The Team **cannot**:

* Manage other teams
* Manage other clubs
* Create league-wide matches
* Modify standings
* Approve players
* Approve team registrations
* Manage competitions
* Manage Super Admin settings

These activities are controlled by the Super Admin.

---

## 12. Team Feature Summary

```text
Team Portal
│
├── Dashboard
├── Team Profile
├── Players
├── Competitions
├── Fixtures
├── Results
├── Standings
├── Statistics
└── Registrations
```

> **Note:** Club-owned teams and independent teams use the same basic Team Portal. Their main difference is who manages the team: a Club Admin manages a club-owned team, while a Team Owner/Manager manages an independent team.
