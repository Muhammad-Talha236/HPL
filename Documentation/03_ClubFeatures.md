# Club Features

## 1. Overview

A **Club** is a registered football organization on the platform.

A club can have multiple teams, including separate men's and women's teams.

The Club Portal allows club administrators to manage their club information, teams, players, and football activities.

---

## 2. Club Dashboard

The club dashboard provides an overview of the club's activities.

### Features

* Total teams
* Total players
* Upcoming matches
* Recent match results
* Active competitions
* Team performance summary
* Pending registrations

---

## 3. Club Profile

The club can manage its public information.

### Features

* View club profile
* Edit club information
* Update club logo
* Update club description
* Manage club contact information
* View club location
* View club registration status

---

## 4. Team Management

The club can manage the teams that belong to it.

### Features

* View all club teams
* Register a new team
* View team details
* Update team information
* View team players
* View team statistics
* View team fixtures and results

The club can have separate teams for different categories, such as:

```text
Club
│
├── Men's Team
└── Women's Team
```

Additional team categories can be added in the future.

---

## 5. Player Management

The club can manage players associated with its teams.

### Features

* View club players
* Add players to a team
* Submit player registrations
* View player profiles
* Update allowed player information
* View player statistics
* Remove a player from a team

Player registrations may require **Super Admin approval**.

---

## 6. Match & Fixture Information

The club can view match-related information for its teams.

### Features

* View upcoming matches
* View previous matches
* View match results
* View match schedules
* View match venues
* View match status

The club does not directly create league matches. Match scheduling is managed by the Super Admin.

---

## 7. Competition Information

The club can view competitions in which its teams participate.

### Features

* View active competitions
* View participating teams
* View competition fixtures
* View standings
* View competition results
* View team performance

---

## 8. Club Statistics

The club can view overall performance information.

### Features

* Total matches
* Wins
* Draws
* Losses
* Goals scored
* Goals conceded
* Points
* Team statistics
* Player statistics

---

## 9. Registration

The club can submit registrations through the platform.

### Features

* Register a new team
* Register players
* View registration status
* View pending registrations
* View approved registrations
* View rejected registrations

---

## 10. Men's & Women's Teams

A club can manage both men's and women's football teams.

```text
Club
│
├── Men's Football
│   ├── Team
│   ├── Players
│   ├── Matches
│   └── Statistics
│
└── Women's Football
    ├── Team
    ├── Players
    ├── Matches
    └── Statistics
```

The club can switch between its men's and women's teams from the Club Portal.

---

## 11. Club Access Restrictions

The Club can manage only its own information and related teams.

The Club **cannot**:

* Manage other clubs
* Create league-wide matches
* Manage competitions
* Manage other teams
* Approve registrations
* Manage Super Admin settings
* Modify league-wide standings

These activities are controlled by the Super Admin.

---

## 12. Club Feature Summary

```text
Club Portal
│
├── Dashboard
├── Club Profile
├── Team Management
├── Player Management
├── Matches & Fixtures
├── Competitions
├── Statistics
└── Registrations
```

> **Note:** Detailed team-level permissions and workflows will be defined separately in the **Team Features** document.
