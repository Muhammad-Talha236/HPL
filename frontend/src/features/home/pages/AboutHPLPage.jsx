import { Link } from "react-router-dom";

const AboutHPLPage = () => (
  <main className="min-h-screen bg-[#f8fbfa] px-5 pb-16 pt-[120px] text-[#101828] sm:px-7 lg:px-8">
    <section className="mx-auto max-w-[900px]">
      <p className="text-sm font-bold uppercase tracking-[.13em] text-[#087554]">About HPL</p>
      <h1 className="mt-3 text-hero max-w-[680px] tracking-[-.045em] text-[#081a42]">Football for a Stronger <span className="text-[#087554]">Hunza</span></h1>
      <div className="mt-7 space-y-4 text-body text-[#53617c]">
        <p>Hunza Premier League is a regional football platform dedicated to promoting local talent, strengthening community engagement, and building a stronger, healthier, and more united Hunza through the power of football.</p>
        <p>HPL brings together teams, players, and fans from across Hunza and surrounding regions to create competitive opportunities, nurture young talent, and celebrate the spirit of the game.</p>
      </div>
      <Link to="/" className="text-button mt-8 inline-flex rounded-md bg-[#087554] px-5 py-3 text-white transition hover:bg-[#066247]">Back to Home</Link>
    </section>
  </main>
);

export default AboutHPLPage;
