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
import AdminRegistrationsPage from "./features/registrations/pages/AdminRegistrationsPage";
import AdminRegistrationDetailsPage from "./features/registrations/pages/AdminRegistrationDetailsPage";

function App() {
  return (
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
          <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
          <Route path="/admin/registrations/:registrationId" element={<AdminRegistrationDetailsPage />} />
        </Route>

        {/* Guest-only authentication routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
