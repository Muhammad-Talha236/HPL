import Component from "../components/ApplicationDetails";
import { useParams } from "react-router-dom";
export default function AdminRegistrationDetailsPage() { const { registrationId } = useParams(); return <Component key={registrationId} admin={true} />; }
