import { useState, useEffect } from "react";

const EXPAND_BREAKPOINT = 1280; // xl — above this: expanded

export function useSidebarAutoCollapse(): boolean {
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < EXPAND_BREAKPOINT : true
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${EXPAND_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsCollapsed(!e.matches);
    mql.addEventListener("change", handler);
    setIsCollapsed(!mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isCollapsed;
}
