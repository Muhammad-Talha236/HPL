const NewsPagination = ({ pagination, onPageChange }) => {
  const {
    page = 1,
    total_pages: totalPages = 0,
    has_previous: hasPrevious,
    has_next: hasNext,
  } = pagination;

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="News pages" className="mt-6 flex items-center justify-between gap-4 border-t border-[#e2e9e6] pt-4">
      <button type="button" disabled={!hasPrevious} onClick={() => onPageChange(page - 1)} className="rounded-md border border-[#d8e3df] px-3 py-2 text-[9px] font-extrabold text-[#415269] transition hover:border-[#087d50] disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-[#087d50]/25">Previous</button>
      <span className="text-[9px] font-bold text-[#6a798c]">Page {page} of {totalPages}</span>
      <button type="button" disabled={!hasNext} onClick={() => onPageChange(page + 1)} className="rounded-md border border-[#d8e3df] px-3 py-2 text-[9px] font-extrabold text-[#415269] transition hover:border-[#087d50] disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-[#087d50]/25">Next</button>
    </nav>
  );
};

export default NewsPagination;
