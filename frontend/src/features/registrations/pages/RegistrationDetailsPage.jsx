import Component from "../components/ApplicationDetails";
import { useParams } from "react-router-dom";
export default function RegistrationDetailsPage() { const { registrationId } = useParams(); return <Component key={registrationId} admin={false} />; }
