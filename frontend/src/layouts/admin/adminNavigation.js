import {
  CalendarDays,
  Image,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  ShieldEllipsis,
  Trophy,
  UserRoundCog,
  UsersRound,
  UserSquare2,
  Volleyball,
  Warehouse,
} from "lucide-react";
import { FEATURES } from "../../constants/features";

export const adminNavigation = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Management",
    items: [
      { label: "Users", to: "/admin/users", icon: UsersRound },
      ...(FEATURES.CLUBS_ENABLED ? [{ label: "Clubs", to: "/admin/clubs", icon: Warehouse }] : []),
      { label: "Teams", to: "/admin/teams", icon: ShieldCheck },
      { label: "Players", to: "/admin/players", icon: UserSquare2 },
      { label: "Referees", to: "/admin/referees", icon: UserRoundCog },
    ],
  },
  {
    label: "Competitions",
    items: [
      { label: "Seasons", to: "/admin/seasons", icon: CalendarDays },
      { label: "Competitions", to: "/admin/competitions", icon: Trophy },
      { label: "Registrations", to: "/admin/registrations", icon: UsersRound },
      { label: "Fixtures & Matches", to: "/admin/matches", icon: Volleyball },
      { label: "Venues", to: "/admin/venues", icon: Warehouse },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "News & Announcements", to: "/admin/news", icon: Newspaper },
      { label: "Media Library", to: "/admin/media", icon: Image },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Approval History", to: "/admin/audit-logs", icon: ShieldEllipsis },
    ],
  },
];
