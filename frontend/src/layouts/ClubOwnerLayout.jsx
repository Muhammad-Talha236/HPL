import PortalShell from "./PortalShell";
import { Navigate } from "react-router-dom";
import { FEATURES } from "../constants/features";

const navigation = [
  { group: "OVERVIEW", label: "Dashboard", to: "/club" },
  { group: "CLUB", label: "My Club", to: "/club/profile" },
  { label: "Teams", to: "/club/teams" },
  { label: "Players", to: "/club/players" },
  { group: "COMPETITIONS", label: "Competitions", to: "/club/competitions" },
  { label: "Registrations", to: "/club/registrations" },
  { group: "OPERATIONS", label: "Payments", to: "/club/payments" },
];

export default function ClubOwnerLayout() {
  if (!FEATURES.CLUBS_ENABLED) return <Navigate to="/teams" replace />;

  return <PortalShell roleLabel="CLUB OWNER" brandLabel="CLUB" navigation={navigation} />;
}
