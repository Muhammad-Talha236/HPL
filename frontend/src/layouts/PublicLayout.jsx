import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";

const PublicLayout = () => {
  const { pathname } = useLocation();

  // Admin routes own their complete shell. Keeping the public fixed Navbar
  // around them causes its viewport offsets and footer to interfere with the
  // admin sidebar/content layout.
  if (pathname.startsWith("/admin") || pathname.startsWith("/club")) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#011427]">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
