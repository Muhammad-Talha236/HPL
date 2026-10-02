import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";

import GuestRoute from "./routes/GuestRoute";

import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";

function App() {
  return (
    <Routes>
      {/* Public Website */}
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#011427] px-5 pt-20 text-center text-white">
              <div>
                <h1 className="text-3xl font-extrabold tracking-wide">
                  HUNZA PREMIER LEAGUE
                </h1>
                <p className="mt-3 text-sm text-white/60">
                  Welcome to the Hunza Premier League.
                </p>
              </div>
            </div>
          }
        />

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
