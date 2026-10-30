"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);

  media.addEventListener("change", callback);

  navigator.connection?.addEventListener?.(
    "change",
    callback
  );

  return () => {
    media.removeEventListener(
      "change",
      callback
    );

    navigator.connection?.removeEventListener?.(
      "change",
      callback
    );
  };
}

function getSnapshot() {
  const reducedMotion =
    window.matchMedia(
      REDUCED_MOTION_QUERY
    ).matches;

  const saveData =
    navigator.connection?.saveData === true;

  return !reducedMotion && !saveData;
}

function getServerSnapshot() {
  return false;
}

export default function useMotionAllowed() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}