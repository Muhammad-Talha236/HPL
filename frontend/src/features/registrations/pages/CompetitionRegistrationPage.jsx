import Component from "../components/ManualRegistrationWizard";
import { useParams } from "react-router-dom";
export default function CompetitionRegistrationPage() { const { competitionId, registrationId } = useParams(); return <Component key={`${competitionId || ""}:${registrationId || ""}`} />; }
