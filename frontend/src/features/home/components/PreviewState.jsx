const PreviewState = ({ status, emptyMessage, errorMessage }) => {
  if (status === "loading") {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-white/50">
        Loading the latest league information…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-white/50">
      {status === "error" ? errorMessage : emptyMessage}
    </div>
  );
};

export default PreviewState;
