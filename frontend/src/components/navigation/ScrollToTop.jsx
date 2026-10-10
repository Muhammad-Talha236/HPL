import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { hash, pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Hash links and browser history retain their intended target/position.
    // Filter changes only update search parameters, so they do not trigger this.
    if (hash || navigationType === "POP") return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [hash, navigationType, pathname]);

  return null;
};

export default ScrollToTop;
