import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";

import GuestRoute from "./routes/GuestRoute";

import HomePage from "./features/home/pages/HomePage";
import SeasonDetailsPage from "./features/seasons/pages/SeasonDetailsPage";
import SeasonsPage from "./features/seasons/pages/SeasonsPage";
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

        {/* Guest-only authentication routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" ele4ment={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
