import PortalShell from "./PortalShell";

const navigation = [
  { group: "OVERVIEW", label: "Dashboard", to: "/referee/dashboard" },
  { group: "ASSIGNMENTS", label: "My Matches", to: "/referee/matches" },
];

export default function RefereeLayout() {
  return <PortalShell roleLabel="REFEREE" brandLabel="OFFICIAL" navigation={navigation} />;
}
