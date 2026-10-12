import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";

export default function RecoveryLayout({ title, children }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#F4F7F5] px-4 py-10 text-[#0B1D2F]">
    <section className="w-full max-w-md rounded-2xl border border-[#D8E0E8] bg-white p-6 shadow-sm sm:p-9" aria-labelledby="recovery-title">
      <img src={logo} alt="Hunza Premier League" className="mx-auto mb-6 h-20 w-20 object-contain" />
      <h1 id="recovery-title" className="mb-4 text-center text-2xl font-bold">{title}</h1>
      {children}
      <Link to="/login" className="mt-6 block text-center font-bold text-[#087554] hover:underline">Back to Login</Link>
    </section>
  </main>;
}
