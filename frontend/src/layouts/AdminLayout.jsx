import PortalShell from "./PortalShell";
import { FEATURES } from "../constants/features";

const navigation = [
  { group: "OVERVIEW", label: "Dashboard", to: "/admin" },
  { group: "MANAGEMENT", label: "Users", to: "/admin/users" },
  ...(FEATURES.CLUBS_ENABLED ? [{ label: "Clubs", to: "/admin/clubs" }] : []),
  { label: "Teams", to: "/admin/teams" },
  { label: "Players", to: "/admin/players" },
  { group: "COMPETITION", label: "Seasons", to: "/admin/seasons" },
  { label: "Competitions", to: "/admin/competitions" },
  { label: "Venues", to: "/admin/venues" },
  { label: "Matches", to: "/admin/matches" },
  { group: "OFFICIALS", label: "Referees", to: "/admin/referees" },
  { group: "OPERATIONS", label: "Registrations", to: "/admin/registrations" },
  { label: "News", to: "/admin/news" },
  { group: "SYSTEM", label: "Audit Logs", to: "/admin/audit-logs" },
];

export default function AdminLayout() {
  return <PortalShell roleLabel="SUPER ADMIN" brandLabel="ADMIN" navigation={navigation} />;
}
