import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MatchPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 7,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const startItem =
    (currentPage - 1) * pageSize + 1;

  const endItem = Math.min(
    currentPage * pageSize,
    totalItems
  );

  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className="
        flex
        flex-col
        gap-3
        border-t
        border-[#e9efec]
        bg-[#fbfcfc]
        px-4
        py-3.5
        sm:flex-row
        sm:items-center
        sm:justify-between
        lg:px-5
      "
    >
      {/* INFO */}

      <p
        className="
          text-[10px]
          font-medium
          text-[#7c8999]
          xl:text-[11px]
        "
      >
        Showing{" "}
        <strong className="text-[#07182d]">
          {startItem}
        </strong>
        {" - "}
        <strong className="text-[#07182d]">
          {endItem}
        </strong>
        {" of "}
        <strong className="text-[#07182d]">
          {totalItems}
        </strong>
        {" matches"}
      </p>

      {/* CONTROLS */}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(currentPage - 1)
          }
          aria-label="Previous page"
          className="
            grid
            h-8
            w-8
            place-items-center
            rounded-md
            border
            border-[#dce5e1]
            bg-white
            text-[#53617a]
            transition-all

            enabled:cursor-pointer
            enabled:hover:border-[#078052]
            enabled:hover:bg-[#078052]
            enabled:hover:text-white

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <ChevronLeft
            size={15}
            strokeWidth={2}
          />
        </button>

        {visiblePages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="
                  grid
                  h-8
                  min-w-7
                  place-items-center
                  text-[11px]
                  font-semibold
                  text-[#8b98a8]
                "
              >
                ...
              </span>
            );
          }

          const active =
            currentPage === page;

          return (
            <button
              key={page}
              type="button"
              onClick={() =>
                onPageChange(page)
              }
              className={`
                grid
                h-8
                min-w-8
                cursor-pointer
                place-items-center
                rounded-md
                border
                px-2
                text-[10px]
                font-bold
                transition-all
                xl:text-[11px]

                ${
                  active
                    ? `
                      border-[#078052]
                      bg-[#078052]
                      text-white
                      shadow-[0_3px_8px_rgba(7,128,82,0.18)]
                    `
                    : `
                      border-[#dce5e1]
                      bg-white
                      text-[#53617a]
                      hover:border-[#078052]
                      hover:text-[#078052]
                    `
                }
              `}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() =>
            onPageChange(currentPage + 1)
          }
          aria-label="Next page"
          className="
            grid
            h-8
            w-8
            place-items-center
            rounded-md
            border
            border-[#dce5e1]
            bg-white
            text-[#53617a]
            transition-all

            enabled:cursor-pointer
            enabled:hover:border-[#078052]
            enabled:hover:bg-[#078052]
            enabled:hover:text-white

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <ChevronRight
            size={15}
            strokeWidth={2}
          />
        </button>
      </div>
    </div>
  );
};

export default MatchPagination;