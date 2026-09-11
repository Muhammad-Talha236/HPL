# Role-Based Access

## 1. Overview

The football league system has four main types of users:

* **Super Admin**
* **Club**
* **Team**
* **Normal User**

Each role has different responsibilities and access to the system.

---

## 2. Super Admin

The **Super Admin** manages the overall football league platform.

### Responsibilities

* Manage the complete website.
* Approve or reject club registrations.
* Approve or reject team registrations.
* Manage players and player profiles.
* Create and manage matches.
* Manage competitions and seasons.
* Manage men's and women's football.
* Manage clubs, teams, and venues.
* Publish news and announcements.
* Monitor the overall league activities.

### Access

The Super Admin has access to all major management features of the system.

---

## 3. Club

A **Club** represents a registered football club in the league.

A club can have one or more teams, such as a men's team and a women's team.

### Responsibilities

* Manage the club profile.
* Register teams under the club.
* Manage players belonging to the club's teams.
* View fixtures and match results.
* View team performance and statistics.
* Track the club's participation in competitions.

### Access

Club users can manage their own club and its related teams and players. They cannot manage other clubs or the overall league system.

---

## 4. Team

A **Team** represents a football team participating in competitions.

Teams belong to a club.

### Responsibilities

* Manage team information.
* Manage team players.
* View upcoming matches.
* View previous match results.
* View team standings and statistics.
* Track team performance.

### Access

Team users can manage and view information related to their own team. They cannot manage other teams or league-wide settings.

---

## 5. Normal User

A **Normal User** is a general website user who can access public football information.

### Responsibilities

Normal users do not manage league data. They mainly use the website to view information.

### Access

Normal users can:

* View men's football information.
* View women's football information.
* View clubs and teams.
* View player profiles.
* View upcoming matches.
* View match results.
* View league standings.
* Read news and announcements.
* View team and player statistics.

Normal users cannot manage clubs, teams, players, matches, or league settings.

---

## 6. Role Summary

| Role            | Main Purpose                                  |
| --------------- | --------------------------------------------- |
| **Super Admin** | Manages the complete football league platform |
| **Club**        | Manages a registered club and its teams       |
| **Team**        | Manages a participating football team         |
| **Normal User** | Views and follows public football information |

---

## 7. Basic Access Structure

```text
Super Admin
    │
    ├── Clubs
    │     └── Teams
    │           └── Players
    │
    ├── Competitions
    ├── Matches
    ├── Seasons
    ├── Venues
    └── News & Announcements

Normal User
    │
    ├── Clubs
    ├── Teams
    ├── Players
    ├── Matches
    ├── Standings
    └── News
```

> **Note:** Men's and women's football will use the same overall role structure, while their teams, players, matches, and competitions can be managed separately.
