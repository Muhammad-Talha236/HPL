import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import GuestRoute from "./routes/GuestRoute";
import HomePage from "./features/home/pages/HomePage";
import SeasonDetailsPage from "./features/seasons/pages/SeasonDetailsPage";
import SeasonsPage from "./features/seasons/pages/SeasonsPage";
import TeamDetailsPage from "./features/teams/pages/TeamDetailsPage";
import TeamsPage from "./features/teams/pages/TeamsPage";
import PlayerDetailsPage from "./features/players/pages/PlayerDetailsPage";
import PlayersPage from "./features/players/pages/PlayersPage";
import CompetitionDetailsPage from "./features/competitions/pages/CompetitionDetailsPage";
import CompetitionsPage from "./features/competitions/pages/CompetitionsPage";
import MatchDetailsPage from "./features/matches/pages/MatchDetailsPage";
import MatchesPage from "./features/matches/pages/MatchesPage";
import StandingsPage from "./features/standings/pages/StandingsPage";
import RankingsPage from "./features/rankings/pages/RankingsPage";
import NewsPage from "./features/news/pages/NewsPage";
import NewsDetailsPage from "./features/news/pages/NewsDetailsPage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import RefereesPage from "./features/referees/pages/RefereesPage";
import RefereeDetailsPage from "./features/referees/pages/RefereeDetailsPage";
import RefereeRankingsPage from "./features/referees/pages/RefereeRankingsPage";
import RefereeDashboardPage from "./features/referees/pages/RefereeDashboardPage";
import RefereeMatchesPage from "./features/referees/pages/RefereeMatchesPage";
import RefereeWorkspacePage from "./features/referees/pages/RefereeWorkspacePage";
import RefereeRoute from "./routes/RefereeRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import CompetitionRegistrationPage from "./features/registrations/pages/CompetitionRegistrationPage";
import MyRegistrationsPage from "./features/registrations/pages/MyRegistrationsPage";
import RegistrationDetailsPage from "./features/registrations/pages/RegistrationDetailsPage";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./layouts/AdminLayout";

const AdminDashboardPage = lazy(() => import("./features/admin/pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./features/admin/pages/AdminUsersPage"));
const AdminUserDetailsPage = lazy(() => import("./features/admin/pages/AdminUserDetailsPage"));
const AdminClubsPage = lazy(() => import("./features/admin/pages/AdminClubsPage"));
const AdminClubFormPage = lazy(() => import("./features/admin/pages/AdminClubFormPage"));
const AdminClubDetailsPage = lazy(() => import("./features/admin/pages/AdminClubDetailsPage"));
const AdminTeamsPage = lazy(() => import("./features/admin/pages/AdminTeamsPage"));
const AdminTeamFormPage = lazy(() => import("./features/admin/pages/AdminTeamFormPage"));
const AdminTeamDetailsPage = lazy(() => import("./features/admin/pages/AdminTeamDetailsPage"));
const AdminTeamEditPage = lazy(() => import("./features/admin/pages/AdminTeamEditPage"));
const AdminPlayersPage = lazy(() => import("./features/admin/pages/AdminPlayersPage"));
const AdminPlayerFormPage = lazy(() => import("./features/admin/pages/AdminPlayerFormPage"));
const AdminPlayerDetailsPage = lazy(() => import("./features/admin/pages/AdminPlayerDetailsPage"));
const AdminPlayerEditPage = lazy(() => import("./features/admin/pages/AdminPlayerEditPage"));
const AdminSeasonsPage = lazy(() => import("./features/admin/pages/AdminSeasonsPage"));
const AdminSeasonFormPage = lazy(() => import("./features/admin/pages/AdminSeasonFormPage"));
const AdminSeasonDetailsPage = lazy(() => import("./features/admin/pages/AdminSeasonDetailsPage"));
const AdminCompetitionsPage = lazy(() => import("./features/admin/pages/AdminCompetitionsPage"));
const AdminCompetitionFormPage = lazy(() => import("./features/admin/pages/AdminCompetitionFormPage"));
const AdminCompetitionDetailsPage = lazy(() => import("./features/admin/pages/AdminCompetitionDetailsPage"));
const AdminVenuesPage = lazy(() => import("./features/admin/pages/AdminVenuesPage"));
const AdminVenueFormPage = lazy(() => import("./features/admin/pages/AdminVenueFormPage"));
const AdminVenueDetailsPage = lazy(() => import("./features/admin/pages/AdminVenueDetailsPage"));
const AdminRefereesPage = lazy(() => import("./features/admin/pages/AdminRefereesPage"));
const AdminRefereeFormPage = lazy(() => import("./features/admin/pages/AdminRefereeFormPage"));
const AdminRefereeDetailsPage = lazy(() => import("./features/admin/pages/AdminRefereeDetailsPage"));
const AdminMatchesPage = lazy(() => import("./features/admin/pages/AdminMatchesPage"));
const AdminMatchFormPage = lazy(() => import("./features/admin/pages/AdminMatchFormPage"));
const AdminMatchDetailsPage = lazy(() => import("./features/admin/pages/AdminMatchDetailsPage"));
const AdminNewsPage = lazy(() => import("./features/admin/pages/AdminNewsPage"));
const AdminNewsFormPage = lazy(() => import("./features/admin/pages/AdminNewsFormPage"));
const AdminNewsDetailsPage = lazy(() => import("./features/admin/pages/AdminNewsDetailsPage"));
const AdminAuditLogsPage = lazy(() => import("./features/admin/pages/AdminAuditLogsPage"));
const AdminAuditLogDetailsPage = lazy(() => import("./features/admin/pages/AdminAuditLogDetailsPage"));
const AdminRegistrationsPage = lazy(() => import("./features/registrations/pages/AdminRegistrationsPage"));
const AdminRegistrationDetailsPage = lazy(() => import("./features/registrations/pages/AdminRegistrationDetailsPage"));

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#061525] p-8 text-white/60" role="status">Loading page…</div>}>
      <Routes>
      {/* Public Website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/seasons" element={<SeasonsPage />} />
        <Route path="/seasons/:seasonId" element={<SeasonDetailsPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:teamId" element={<TeamDetailsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/players/:playerId" element={<PlayerDetailsPage />} />
        <Route path="/competitions" element={<CompetitionsPage />} />
        <Route path="/competitions/:competitionId" element={<CompetitionDetailsPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:matchId" element={<MatchDetailsPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:newsId" element={<NewsDetailsPage />} />
        <Route path="/referees" element={<RefereesPage />} />
        <Route path="/referees/rankings" element={<RefereeRankingsPage />} />
        <Route path="/referees/:refereeId" element={<RefereeDetailsPage />} />

        <Route element={<RefereeRoute />}>
          <Route path="/referee/dashboard" element={<RefereeDashboardPage />} />
          <Route path="/referee/matches" element={<RefereeMatchesPage />} />
          <Route path="/referee/matches/:matchId" element={<RefereeWorkspacePage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/competitions/:competitionId/register" element={<CompetitionRegistrationPage />} />
          <Route path="/my/registrations" element={<MyRegistrationsPage />} />
          <Route path="/my/registrations/:registrationId" element={<RegistrationDetailsPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetailsPage />} />
            <Route path="/admin/clubs" element={<AdminClubsPage />} />
            <Route path="/admin/clubs/new" element={<AdminClubFormPage />} />
            <Route path="/admin/clubs/:clubId" element={<AdminClubDetailsPage />} />
            <Route path="/admin/teams" element={<AdminTeamsPage />} />
            <Route path="/admin/teams/new" element={<AdminTeamFormPage />} />
            <Route path="/admin/teams/:teamId" element={<AdminTeamDetailsPage />} />
            <Route path="/admin/teams/:teamId/edit" element={<AdminTeamEditPage />} />
            <Route path="/admin/players" element={<AdminPlayersPage />} />
            <Route path="/admin/players/new" element={<AdminPlayerFormPage />} />
            <Route path="/admin/players/:playerId" element={<AdminPlayerDetailsPage />} />
            <Route path="/admin/players/:playerId/edit" element={<AdminPlayerEditPage />} />
            <Route path="/admin/seasons" element={<AdminSeasonsPage />} />
            <Route path="/admin/seasons/new" element={<AdminSeasonFormPage />} />
            <Route path="/admin/seasons/:seasonId" element={<AdminSeasonDetailsPage />} />
            <Route path="/admin/seasons/:seasonId/edit" element={<AdminSeasonFormPage />} />
            <Route path="/admin/competitions" element={<AdminCompetitionsPage />} />
            <Route path="/admin/competitions/new" element={<AdminCompetitionFormPage />} />
            <Route path="/admin/competitions/:competitionId" element={<AdminCompetitionDetailsPage />} />
            <Route path="/admin/competitions/:competitionId/edit" element={<AdminCompetitionFormPage />} />
            <Route path="/admin/venues" element={<AdminVenuesPage />} />
            <Route path="/admin/venues/new" element={<AdminVenueFormPage />} />
            <Route path="/admin/venues/:venueId" element={<AdminVenueDetailsPage />} />
            <Route path="/admin/venues/:venueId/edit" element={<AdminVenueFormPage />} />
            <Route path="/admin/referees" element={<AdminRefereesPage />} />
            <Route path="/admin/referees/new" element={<AdminRefereeFormPage />} />
            <Route path="/admin/referees/:refereeId" element={<AdminRefereeDetailsPage />} />
            <Route path="/admin/referees/:refereeId/edit" element={<AdminRefereeFormPage />} />
            <Route path="/admin/matches" element={<AdminMatchesPage />} />
            <Route path="/admin/matches/new" element={<AdminMatchFormPage />} />
            <Route path="/admin/matches/:matchId" element={<AdminMatchDetailsPage />} />
            <Route path="/admin/matches/:matchId/edit" element={<AdminMatchFormPage />} />
            <Route path="/admin/news" element={<AdminNewsPage />} />
            <Route path="/admin/news/new" element={<AdminNewsFormPage />} />
            <Route path="/admin/news/:newsId" element={<AdminNewsDetailsPage />} />
            <Route path="/admin/news/:newsId/edit" element={<AdminNewsFormPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/audit-logs/:auditId" element={<AdminAuditLogDetailsPage />} />
            <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
            <Route path="/admin/registrations/:registrationId" element={<AdminRegistrationDetailsPage />} />
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

        {/* Guest-only authentication routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
