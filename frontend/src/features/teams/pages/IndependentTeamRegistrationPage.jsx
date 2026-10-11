import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ImagePlus, MailCheck, ShieldCheck } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import { resendEmailVerification } from "../../auth/services/authService";
import MediaUploader from "../../media/components/MediaUploader";
import { getOwnTeamLogoMedia, uploadOwnTeamLogoMedia } from "../../media/services/mediaService";
import { getIndependentTeamVenues, registerIndependentTeam } from "../services/independentTeamRegistrationService";

const initial = {
  name: "", gender: "MEN", team_type: "", home_venue_id: "", logo: "",
  region: "", district: "", city: "", description: "", contact_phone: "",
  declaration_accepted: false,
};
const input = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0B5D46] focus:ring-2 focus:ring-[#0B5D46]/15";
const Field = ({ label, error, children }) => <label className="block text-xs font-bold uppercase tracking-wide text-slate-600"><span>{label}</span>{children}{error && <span className="mt-1 block normal-case tracking-normal text-red-600">{error}</span>}</label>;
const Section = ({ icon, title, text, children }) => <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="mt-0.5 text-[#0B5D46]">{icon}</span><div><h2 className="font-extrabold">{title}</h2><p className="mt-1 text-xs text-slate-500">{text}</p></div></div>{children}</section>;

export default function IndependentTeamRegistrationPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [venues, setVenues] = useState([]);
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const set = (key, value) => {
    setForm((state) => ({ ...state, [key]: value }));
    setErrors((state) => ({ ...state, [key]: "" }));
  };
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setVenues(await getIndependentTeamVenues());
      try {
        const media = await getOwnTeamLogoMedia();
        setLogos(media.data || []);
      } catch {
        setLogos([]);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Active venues could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter a team name of at least 2 characters.";
    if (!form.team_type.trim()) next.team_type = "Team type is required.";
    if (!form.home_venue_id) next.home_venue_id = "Choose an active home venue.";
    if (!user?.email) next.email_verified = "Your account email could not be loaded.";
    if (!user?.email_verified) next.email_verified = "Verify your account email before submitting.";
    if (form.contact_phone.trim().length < 7 || form.contact_phone.trim().length > 30) next.contact_phone = "Enter a contact phone number between 7 and 30 characters.";
    if (!form.declaration_accepted) next.declaration_accepted = "Accept the registration declaration to continue.";
    setErrors(next);
    return !Object.keys(next).length;
  };
  const submit = async (event) => {
    event.preventDefault();
    if (submitting || !user?.email_verified || !validate()) return;
    setSubmitting(true);
    setError("");
    try {
      await registerIndependentTeam({ ...form, home_venue_id: Number(form.home_venue_id) });
      setSubmitted(true);
    } catch (requestError) {
      const response = requestError.response?.data;
      setError(response?.message || "Your application could not be submitted.");
      setErrors((state) => ({ ...state, ...Object.fromEntries((response?.errors || []).filter((item) => item.path).map((item) => [item.path, item.msg])) }));
    } finally {
      setSubmitting(false);
    }
  };
  const resend = async () => {
    setResending(true);
    setVerificationMessage("");
    try {
      const response = await resendEmailVerification();
      setVerificationMessage(response.message);
    } catch (requestError) {
      setVerificationMessage(requestError.response?.data?.message || "The verification email could not be sent.");
    } finally {
      setResending(false);
    }
  };
  if (submitted) return <main className="min-h-screen bg-[#f4f7fb] px-4 pb-16 pt-24 text-[#10213f]"><section className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white p-7 text-center shadow-sm"><CheckCircle2 className="mx-auto text-[#0B5D46]" size={42}/><h1 className="mt-4 text-2xl font-extrabold">Application submitted</h1><p className="mt-3 text-sm leading-6 text-slate-600">HPL will review your application and notify you if changes are needed or once you can build your squad.</p><Link to="/account" className="mt-6 inline-flex rounded-lg bg-[#0B5D46] px-4 py-2.5 text-sm font-bold text-white">Back to account</Link></section></main>;
  if (loading) return <main className="min-h-screen bg-[#f4f7fb] px-4 pt-24"><div className="mx-auto h-[34rem] max-w-4xl animate-pulse rounded-2xl bg-white"/></main>;
  return <main className="min-h-screen bg-[#f4f7fb] px-4 pb-16 pt-24 text-[#10213f] sm:px-6"><div className="mx-auto max-w-4xl"><nav className="flex gap-1 text-xs text-slate-500"><Link to="/">Home</Link><span>›</span><span>Independent team application</span></nav><header className="mt-5 rounded-2xl bg-[#0B5D46] px-5 py-7 text-white sm:px-8"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15"><ShieldCheck size={25}/></span><div><h1 className="text-2xl font-extrabold sm:text-3xl">Register Independent Team</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Submit your team for HPL review. Final verification unlocks public listing and competition registration.</p></div></div></header>{error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <button type="button" onClick={load} className="ml-2 font-bold underline">Retry venue loading</button></div>}{!user?.email_verified && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex gap-3"><MailCheck size={20} className="mt-0.5 shrink-0"/><div><p className="font-bold">Verify your account email before applying</p><p className="mt-1">We only use the verified email on your HPL account as the team contact email.</p><button type="button" disabled={resending} onClick={resend} className="mt-3 rounded-lg bg-[#0B5D46] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{resending ? "Sending..." : "Resend verification email"}</button>{verificationMessage && <p className="mt-2 text-xs">{verificationMessage}</p>}</div></div></div>}<form onSubmit={submit} noValidate className="mt-5 space-y-5"><Section icon={<CheckCircle2 size={20}/>} title="Account contact" text="This address is read from your authenticated account and cannot be changed here."><Field label="Verified Account Email" error={errors.email_verified}><input value={user?.email || ""} readOnly aria-readonly="true" className={`${input} bg-slate-50`}/></Field></Section><Section icon={<CheckCircle2 size={20}/>} title="Team information" text="These details are reviewed before HPL creates a provisional independent team."><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Team name *" error={errors.name}><input value={form.name} maxLength="100" onChange={(e) => set("name", e.target.value)} className={input}/></Field><Field label="Team type *" error={errors.team_type}><input value={form.team_type} maxLength="50" onChange={(e) => set("team_type", e.target.value)} className={input}/></Field><Field label="Gender *"><select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={input}><option value="MEN">Men</option><option value="WOMEN">Women</option></select></Field><Field label="Home venue *" error={errors.home_venue_id}><select value={form.home_venue_id} onChange={(e) => set("home_venue_id", e.target.value)} className={input}><option value="">{venues.length ? "Select an active venue" : "No active venues available"}</option>{venues.map((venue) => <option key={venue.venue_id} value={venue.venue_id}>{venue.name}{venue.city ? ` — ${venue.city}` : ""}</option>)}</select>{!venues.length && <span className="mt-1 block normal-case text-xs font-normal text-amber-700">There are currently no active venues. Contact HPL administration.</span>}</Field><Field label="Region"><input value={form.region} maxLength="100" onChange={(e) => set("region", e.target.value)} className={input}/></Field><Field label="District"><input value={form.district} maxLength="100" onChange={(e) => set("district", e.target.value)} className={input}/></Field><Field label="City"><input value={form.city} maxLength="100" onChange={(e) => set("city", e.target.value)} className={input}/></Field><Field label="Contact phone *" error={errors.contact_phone}><input value={form.contact_phone} maxLength="30" onChange={(e) => set("contact_phone", e.target.value)} className={input}/></Field></div><Field label="Team description"><textarea value={form.description} maxLength="1000" rows="4" onChange={(e) => set("description", e.target.value)} className={input}/></Field></Section><Section icon={<ImagePlus size={20}/>} title="Team logo" text="Optional. A media error never blocks the application or venue selection."><div className="mt-5"><MediaUploader category="teams" upload={uploadOwnTeamLogoMedia} imageOnly onUploaded={(media) => { setLogos((items) => [media, ...items]); set("logo", media.secure_url); }}/>{logos.length > 0 && <div className="mt-4 grid max-w-xs grid-cols-5 gap-2">{logos.map((media) => <button key={media.media_id} type="button" onClick={() => set("logo", media.secure_url)} className={`aspect-square overflow-hidden rounded-lg border-2 ${form.logo === media.secure_url ? "border-[#0B5D46]" : "border-transparent"}`}><img src={media.secure_url} alt="" className="h-full w-full object-cover"/></button>)}</div>}</div></Section><label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"><input type="checkbox" checked={form.declaration_accepted} onChange={(e) => set("declaration_accepted", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0B5D46]"/><span>I confirm that the information provided is accurate and I accept the HPL team registration declaration.{errors.declaration_accepted && <span className="mt-1 block text-xs text-red-600">{errors.declaration_accepted}</span>}</span></label><button type="submit" disabled={submitting || !user?.email_verified} className="w-full rounded-xl bg-[#0B5D46] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#094b39] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting..." : "Submit team application"}</button></form></div></main>;
}
