import PortalShell from "./PortalShell";

const navigation = [
  { group: "OVERVIEW", label: "Dashboard", to: "/team" },
  { group: "TEAM", label: "My Team", to: "/team/profile" },
  { label: "Verification", to: "/team/verification" },
  { label: "Players", to: "/team/players" },
  { group: "COMPETITIONS", label: "Competitions", to: "/team/competitions" },
  { label: "Registrations", to: "/team/registrations" },
  { group: "OPERATIONS", label: "Matches", to: "/team/matches" },
  { label: "Payments", to: "/team/payments" },
];

export default function TeamOwnerLayout() {
  return <PortalShell roleLabel="TEAM OWNER" brandLabel="TEAM" navigation={navigation} />;
}
