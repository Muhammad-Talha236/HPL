import { useEffect, useState } from "react";

const NewsSearch = ({ initialQuery, onSearch }) => {
  const [value, setValue] = useState(initialQuery);
  useEffect(() => { const timer = window.setTimeout(() => { const query = value.trim(); if (query.length !== 1) onSearch(query); }, 350); return () => window.clearTimeout(timer); }, [onSearch, value]);
  return <label><span className="sr-only">Search news headlines</span><input id="news-search" type="search" value={value} onChange={(event) => setValue(event.target.value)} maxLength={100} placeholder="Search news headlines" className="h-11 w-full rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30 sm:max-w-sm" /></label>;
};

export default NewsSearch;
