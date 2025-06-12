import { merge } from "lodash";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface ICache {
  [key: string]: { x: number; y: number };
}

function PreserveScroll() {
  const [cache, setCache] = useState({} as ICache);
  const { pathname } = useLocation();
  const key = pathname.replace(/\/$/, "");
  if (!cache[key]) {
    setCache(merge(cache, { [key]: { x: 0, y: 0 } }));
  }

  useEffect(() => {
    const listener = () => {
      setCache(merge(cache, { [key]: { x: window.scrollX, y: window.scrollY } }));
    };
    window.addEventListener("scroll", listener);
    return () => window.removeEventListener("scroll", listener);
  }, [cache, key]);

  useEffect(() => {
    const value = cache[key];
    window?.scrollTo(value.x, value.y);
  }, [cache, key]);

  return null;
}

export default PreserveScroll;
