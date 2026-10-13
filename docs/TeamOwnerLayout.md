# Team Owner portal layout

The Team Owner portal now uses one responsive application shell. Its previous shared PortalShell mounted separate desktop and mobile Outlets, rendering hidden duplicate pages and allowing duplicate data requests. The new TeamOwnerLayout renders one Outlet at every viewport size. Club/Referee shells and the Super Admin portal were not edited.

The implementation follows the active Super Admin layout's fixed-sidebar positioning, navy `#081827` surface, HPL green navigation accent, compact typography, and sticky white header. It uses the existing authentication hook, logo asset, Lucide icons, NavLink/Outlet, and page data loaders. AdminSidebar/AdminHeader are role-specific, so new Team Owner components implement the same patterns without importing Admin navigation or controls.

## Files

Created:

- `frontend/src/features/teamOwner/components/TeamOwnerSidebar.jsx`
- `frontend/src/features/teamOwner/components/TeamOwnerHeader.jsx`
- `docs/TeamOwnerLayout.md`

Modified:

- `frontend/src/layouts/TeamOwnerLayout.jsx`
- `frontend/src/features/teamOwner/pages/TeamOwnerPages.jsx`
- `frontend/src/features/teamOwner/pages/TeamOwnerWorkflowPages.jsx`
- `frontend/src/features/teamOwner/pages/TeamOwnerVerificationPage.jsx`
- `frontend/src/features/teamOwner/pages/TeamOwnerCompetitionsPage.jsx`
- `frontend/src/features/teamOwner/pages/TeamOwnerRegistrationDetailPage.jsx`
- `frontend/src/features/teamOwner/pages/TeamOwnerMatchesPage.jsx`
- `frontend/src/features/teamOwner/pages/TeamOwnerMatchDetailPage.jsx`

## Behavior

- Desktop sidebar: fixed left, 256px wide, 100dvh tall. Branding, user identity, and footer controls stay visible; navigation scrolls independently in a short viewport.
- Header: sticky at the top of the main area, 64px tall, white with a subtle border. It shows the league/role breadcrumb, user name, and existing profile image or initial.
- Main content: offset 256px on desktop, maximum width 1600px, centralized 24–32px desktop padding. Existing page root padding was removed to prevent doubled spacing. The document scrolls; the main area does not introduce another vertical scroll container.
- Navigation retains all eight destinations and four groups. Dashboard uses an exact match; detail pages retain their parent navigation highlight.
- Under 1024px the sidebar becomes a left drawer with backdrop, close button, Escape handling, focus containment/restoration, background inertness, and body scroll locking. Selecting a navigation link closes it. Resizing to desktop also closes the drawer and releases the scroll lock.
- Dashboard uses the requested heading/subtitle, compact responsive summary cards, backend counts for players/registrations/payments/completed matches, and existing team/fixture/result data. Missing counts or scores display a dash instead of an invented zero. Existing skeleton, retry/error, and empty states remain.
- Backend APIs, database, authentication logic, role guards, and route destinations are unchanged.

## Verification

- Frontend production build passed. Vite reports the existing large-bundle warning.
- Focused Oxlint checks passed with no diagnostics.
- Server-render verification across Dashboard, My Team, Verification, Players, Competitions, Registrations, Matches, and Payments passed: exactly one page outlet, one shell header, and an active navigation item for each route.
- Existing Team Owner backend/security/final-QA tests: 12 passed, 1 failed. The failing test expects an inline `/team/*` fallback in App.jsx that is absent in the existing source. App.jsx and the route guard were not modified by this task.
- Git whitespace/diff checks passed. Admin source files have no changes.
- Browser visual checks and interactive drawer/scroll checks were not performed: the session exposes no browser. Responsive positioning and drawer behavior are implemented, but their runtime acceptance checks still need a browser review. Temporary preview fixtures were removed.
