import PortalShell from "./PortalShell";

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
  return <PortalShell roleLabel="CLUB OWNER" brandLabel="CLUB" navigation={navigation} />;
}
