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
