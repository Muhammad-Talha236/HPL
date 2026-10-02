import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";

import GuestRoute from "./routes/GuestRoute";

import HomePage from "./features/home/pages/HomePage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";

function App() {
  return (
    <Routes>
      {/* Public Website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />

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
