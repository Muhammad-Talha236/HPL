import { getNewsCategoryFilters } from "../utils/newsCategories";

const NewsCategoryFilters = ({ categories, value, onChange }) => {
  const filters = getNewsCategoryFilters(categories);

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="News categories">
      <div className="flex min-w-max gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={!value}
          onClick={() => onChange("")}
          className={`h-7 rounded-md border px-3 text-[9px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[#087d50]/25 ${
            !value
              ? "border-[#087d50] bg-[#087d50] text-white"
              : "border-[#dce5e5] bg-white text-[#526275] hover:border-[#9eb9ab]"
          }`}
        >
          All
        </button>
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={value === filter.value}
            onClick={() => onChange(filter.value)}
            className={`h-7 rounded-md border px-3 text-[9px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[#087d50]/25 ${
              value === filter.value
                ? "border-[#087d50] bg-[#087d50] text-white"
                : "border-[#dce5e5] bg-white text-[#526275] hover:border-[#9eb9ab]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NewsCategoryFilters;
