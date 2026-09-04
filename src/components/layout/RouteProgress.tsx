"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * A thin indeterminate bar pinned to the top of the viewport that appears on
 * every route change, so navigation always gives immediate visual feedback.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const firstRef = useRef(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Skip the very first mount (initial page load already has its own
    // suspense/loading UI).
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    setActive(true);
    // Keep the bar briefly even after the new page commits, so fast
    // transitions still register and slow ones don't flash.
    const t = setTimeout(() => setActive(false), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="h-full w-1/3 bg-primary"
            initial={{ x: "-100%" }}
            animate={{ x: "400%" }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
