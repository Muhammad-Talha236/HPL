const HighlightsPanel = () => (
  <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B1D2F] sm:grid sm:grid-cols-[1.1fr_0.9fr]">
    <div className="min-h-56 bg-[radial-gradient(circle_at_65%_35%,rgba(255,85,61,0.35),transparent_26%),linear-gradient(135deg,#173751,#061525)]" />
    <div className="p-6 sm:p-8">
      <p className="text-xs font-bold tracking-[0.16em] text-[#EEC058]">MEDIA HUB</p>
      <h3 className="mt-3 text-2xl font-extrabold text-white">HPL moments, coming soon.</h3>
      <p className="mt-4 text-sm leading-6 text-white/60">Official match photos and video highlights will appear here once HPL media publishing is connected. No video playback is being simulated.</p>
    </div>
  </div>
);

export default HighlightsPanel;
