# Football League — Project Folder Structure

## 1. Architecture Philosophy

The project follows a **feature-based modular architecture**.

The main rule is:

> **Keep feature-specific code inside the feature. Keep reusable code inside shared folders.**

This structure is used consistently across both the frontend and backend.

```text
                    FOOTBALL LEAGUE
                           │
              ┌────────────┴────────────┐
              │                         │
          FRONTEND                    BACKEND
          React.js                  Node.js + Express
              │                         │
          features/                   modules/
              │                         │
       ┌──────┴──────┐           ┌──────┴──────┐
       │             │           │             │
    PRIVATE        SHARED     PRIVATE        SHARED
       │             │           │             │
   teams/          UI/       teams/       middleware/
   players/       layouts/   players/       config/
   matches/       hooks/     matches/       utils/
   clubs/         utils/     clubs/         database/
```

---

# 2. Complete Project Structure

```text
football-league/
│
├── frontend/
│
├── backend/
│
├── docs/
│
├── .gitignore
├── README.md
└── package.json
```

---

# 3. Frontend Structure

```text
frontend/
│
├── public/
│
├── src/
│   │
│   ├── features/
│   │
│   │   ├── auth/
│   │   ├── users/
│   │   ├── clubs/
│   │   ├── teams/
│   │   ├── players/
│   │   ├── seasons/
│   │   ├── competitions/
│   │   ├── registrations/
│   │   ├── payments/
│   │   ├── venues/
│   │   ├── referees/
│   │   ├── matches/
│   │   ├── standings/
│   │   ├── news/
│   │   └── notifications/
│   │
│   ├── components/
│   ├── layouts/
│   ├── sections/
│   ├── hooks/
│   ├── services/
│   ├── routes/
│   ├── context/
│   ├── utils/
│   ├── constants/
│   ├── assets/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
├── package.json
└── vite.config.js
```

---

# 4. Frontend Private Features

`features/` contains **private feature code**.

A feature owns everything that is specifically related to that business domain.

For example:

```text
features/
│
├── teams/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── validators/
│   ├── constants/
│   └── index.js
│
├── players/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── validators/
│   └── index.js
│
└── matches/
    ├── components/
    ├── pages/
    ├── services/
    ├── hooks/
    ├── validators/
    └── index.js
```

### Example: Teams

```text
features/teams/

├── components/
│   ├── TeamCard.jsx
│   ├── TeamForm.jsx
│   ├── TeamPlayerList.jsx
│   └── TeamStats.jsx
│
├── pages/
│   ├── TeamsPage.jsx
│   ├── TeamDetailsPage.jsx
│   └── CreateTeamPage.jsx
│
├── services/
│   └── teamService.js
│
├── hooks/
│   └── useTeams.js
│
├── validators/
│   └── teamValidator.js
│
└── index.js
```

These components should primarily be concerned with the **Team feature**.

---

# 5. Frontend Shared Folders

Shared folders contain code that is **not owned by one specific feature**.

## `components/`

Reusable UI components.

```text
components/
├── Button.jsx
├── Modal.jsx
├── Input.jsx
├── Select.jsx
├── Table.jsx
├── Pagination.jsx
├── Loader.jsx
├── EmptyState.jsx
└── ConfirmationDialog.jsx
```

Example:

```text
TeamForm
PlayerForm
ClubForm
CompetitionForm
        │
        └── all can use
              ↓
           Input.jsx
```

---

## `layouts/`

Application-level layouts.

```text
layouts/
├── PublicLayout.jsx
├── AdminLayout.jsx
├── ClubLayout.jsx
├── TeamLayout.jsx
└── AuthLayout.jsx
```

For example:

```text
Admin Dashboard
       ↓
AdminLayout
       ↓
Admin pages
```

---

## `sections/`

Large reusable page sections.

```text
sections/
├── Navbar/
├── Footer/
├── Hero/
├── FeaturedTeams/
├── LatestMatches/
├── LatestNews/
└── LeagueHighlights/
```

A section can combine multiple shared components and can be used on multiple pages.

---

## `hooks/`

Global/reusable React hooks.

```text
hooks/
├── useAuth.js
├── useDebounce.js
├── usePagination.js
└── useModal.js
```

If a hook is **only useful for Teams**, it should remain inside:

```text
features/teams/hooks/
```

not the shared `hooks/` folder.

---

## `services/`

Only truly global frontend services.

```text
services/
├── apiClient.js
├── storageService.js
└── notificationService.js
```

Feature-specific API calls belong inside their feature:

```text
features/teams/services/teamService.js
```

---

## `routes/`

Application-level routing.

```text
routes/
├── AppRoutes.jsx
├── PublicRoutes.jsx
├── AdminRoutes.jsx
├── ClubRoutes.jsx
└── TeamRoutes.jsx
```

---

## `context/`

Global React contexts.

```text
context/
├── AuthContext.jsx
├── ThemeContext.jsx
└── NotificationContext.jsx
```

Feature-specific state should stay inside the feature when possible.

---

## `utils/`

Generic utilities.

```text
utils/
├── formatDate.js
├── formatCurrency.js
├── formatNumber.js
└── validation.js
```

---

# 6. Backend Structure

The backend follows the **same mental model**.

```text
backend/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   │
│   ├── modules/
│   │
│   │   ├── auth/
│   │   ├── users/
│   │   ├── clubs/
│   │   ├── teams/
│   │   ├── players/
│   │   ├── seasons/
│   │   ├── competitions/
│   │   ├── registrations/
│   │   ├── payments/
│   │   ├── venues/
│   │   ├── referees/
│   │   ├── matches/
│   │   ├── standings/
│   │   ├── news/
│   │   └── notifications/
│   │
│   ├── middleware/
│   ├── config/
│   ├── database/
│   ├── utils/
│   ├── constants/
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .env.example
├── package.json
└── README.md
```

---

# 7. Backend Private Modules

Each module owns its business logic.

For example:

```text
modules/
│
├── teams/
│   ├── team.controller.js
│   ├── team.service.js
│   ├── team.routes.js
│   ├── team.validator.js
│   └── index.js
│
├── players/
│   ├── player.controller.js
│   ├── player.service.js
│   ├── player.routes.js
│   ├── player.validator.js
│   └── index.js
│
└── matches/
    ├── match.controller.js
    ├── match.service.js
    ├── match.routes.js
    ├── match.validator.js
    └── index.js
```

The responsibilities are:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
Neon PostgreSQL
```

### Example

```text
teams/team.routes.js
        ↓
teams/team.controller.js
        ↓
teams/team.service.js
        ↓
Prisma
        ↓
Team table in Neon
```

---

# 8. Backend Shared Folders

## `middleware/`

Middleware used across multiple modules.

```text
middleware/
├── auth.middleware.js
├── role.middleware.js
├── error.middleware.js
├── rateLimit.middleware.js
└── upload.middleware.js
```

For example:

```text
Auth
Teams
Players
Matches
News
     │
     └── can use
           ↓
     auth.middleware.js
```

---

## `config/`

Application configuration.

```text
config/
├── env.js
├── cors.js
└── logger.js
```

---

## `database/`

Database-level application setup.

```text
database/
└── prisma.js
```

This is where the Prisma Client connection can be initialized.

The actual database schema remains:

```text
prisma/
└── schema.prisma
```

---

## `utils/`

Generic backend utilities.

```text
utils/
├── ApiError.js
├── ApiResponse.js
├── pagination.js
└── asyncHandler.js
```

If something is specifically related to Teams, it should **not** go here.

---

## `constants/`

Shared application constants.

```text
constants/
├── roles.js
├── statuses.js
├── competition.js
└── match.js
```

---

# 9. The Most Important Mental Model

Think about the project as **two layers**.

```text
                    PROJECT
                       │
          ┌────────────┴────────────┐
          │                         │
       PRIVATE                    SHARED
          │                         │
   "Who owns this?"          "Who can reuse this?"
          │                         │
          ↓                         ↓
     Feature/Module          Common Application Code
```

### Frontend

```text
PRIVATE                          SHARED

features/                       components/
├── teams/                      layouts/
├── players/                    sections/
├── clubs/                      hooks/
├── matches/                    services/
└── competitions/               routes/
                                context/
                                utils/
```

### Backend

```text
PRIVATE                          SHARED

modules/                        middleware/
├── teams/                      config/
├── players/                    database/
├── clubs/                      utils/
├── matches/                    constants/
└── competitions/
```

---

# 10. How Do We Decide Where a File Goes?

Ask one question:

> **"Is this file specifically owned by one feature?"**

### YES

Put it inside the feature.

```text
TeamCard.jsx
    ↓
features/teams/components/
```

```text
teamService.js
    ↓
features/teams/services/
```

```text
team.service.js
    ↓
modules/teams/
```

### NO

If multiple features can use it, put it in the shared area.

```text
Button.jsx
    ↓
components/
```

```text
auth.middleware.js
    ↓
middleware/
```

---

# 11. Important Rule: Don't Force Sharing

We should **not move something into `shared` just because it might be reusable someday**.

For example:

```text
features/teams/components/TeamCard.jsx
```

is perfectly fine even if another feature *might* use it later.

If it genuinely becomes reusable:

```text
TeamCard
   ↓
used by Teams
used by Club
used by Competition
   ↓
consider moving/reworking it as shared
```

This keeps the codebase clean instead of creating a huge "shared" folder.

---

# 12. Frontend ↔ Backend Mental Model

The biggest advantage of this architecture is that the frontend and backend mirror each other.

```text
                    FOOTBALL LEAGUE
                           │
             ┌─────────────┴─────────────┐
             │                           │
         FRONTEND                      BACKEND
             │                           │
         features/                    modules/
             │                           │
       ┌─────┼─────┐               ┌─────┼─────┐
       │     │     │               │     │     │
     teams players matches       teams players matches
       │     │     │               │     │     │
       │     │     │               │     │     │
       └─────┼─────┘               └─────┼─────┘
             │                           │
          React                       Express
                                         │
                                      Prisma
                                         │
                                    PostgreSQL
                                         │
                                        Neon
```

So when a developer hears:

> "I'm working on Teams."

They immediately know where to look:

```text
frontend/src/features/teams/

backend/src/modules/teams/
```

That's the **clean mental model** we want the whole team to follow.

---

# 13. Team Development Rule

Each developer should primarily work within their assigned feature/module.

For example:

```text
Developer A
├── auth
├── users
└── clubs

Developer B
├── teams
├── players
└── matches

Developer C
├── seasons
├── competitions
├── registrations
├── payments
└── standings
```

But shared folders are owned by the **team**, not one feature developer.

Changes to:

```text
components/
layouts/
middleware/
database/
config/
routes/
```

should be communicated to the team because they can affect multiple modules.

---

# 14. Final Architecture Principle

Our project follows this rule everywhere:

```text
FEATURE-SPECIFIC
       ↓
Private Feature / Module
       ↓
Own components
Own pages
Own services
Own hooks
Own validators
Own business logic


APPLICATION-WIDE
       ↓
Shared
       ↓
Reusable components
Reusable layouts
Reusable hooks
Reusable utilities
Global middleware
Global configuration
```

In one sentence:

> **Private code belongs to the feature that owns it; shared code belongs to the application because multiple features depend on it.**
