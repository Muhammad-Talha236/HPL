import Component from "../components/PublicCompetitionDetails";
import { useParams } from "react-router-dom";
export default function CompetitionDetailsPage() { const { competitionId } = useParams(); return <Component key={competitionId} />; }
