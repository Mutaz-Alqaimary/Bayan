"use client";

import { createContext, useContext, useState } from "react";

import { REDUCED_MOTION_ATTR, REDUCED_MOTION_STORAGE_KEY } from "@/lib/motion";

type MotionContextValue = {
  /** Whether the user has explicitly opted into reduced motion. */
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

/** Read the preference already applied to <html> by the no-flash inline script. */
function readAppliedReducedMotion(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.getAttribute(REDUCED_MOTION_ATTR) === "true"
  );
}

/** Add/remove the `<html>` attribute the CSS reduced-motion guard keys off. */
function applyReducedMotion(value: boolean): void {
  const root = document.documentElement;
  if (value) {
    root.setAttribute(REDUCED_MOTION_ATTR, "true");
  } else {
    root.removeAttribute(REDUCED_MOTION_ATTR);
  }
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Initialized from the DOM the inline script already set up, so there is no
  // setState-in-effect and no animation flash on hydration (mirrors ThemeProvider).
  const [reducedMotion, setState] = useState<boolean>(readAppliedReducedMotion);

  function setReducedMotion(next: boolean) {
    localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(next));
    applyReducedMotion(next);
    setState(next);
  }

  return (
    <MotionContext.Provider value={{ reducedMotion, setReducedMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useReducedMotion(): MotionContextValue {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error("useReducedMotion must be used within a MotionProvider");
  }
  return context;
}
