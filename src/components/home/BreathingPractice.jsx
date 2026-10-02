"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const TOTAL_SECONDS = 24;
const PHASE_SECONDS = 4;

export default function BreathingPractice() {
  const [running, setRunning] =
    useState(false);

  const [seconds, setSeconds] =
    useState(0);

  useEffect(() => {
    if (!running) return undefined;

    const startedAt = Date.now();

    const interval = window.setInterval(
      () => {
        const elapsed = Math.floor(
          (Date.now() - startedAt) / 1000
        );

        setSeconds(
          Math.min(
            elapsed,
            TOTAL_SECONDS
          )
        );

        if (
          elapsed >= TOTAL_SECONDS
        ) {
          setRunning(false);
          window.clearInterval(
            interval
          );
        }
      },
      250
    );

    return () =>
      window.clearInterval(interval);
  }, [running]);

  const active =
    running &&
    seconds < TOTAL_SECONDS;

  const phase = useMemo(() => {
    if (!active) {
      return seconds >= TOTAL_SECONDS
        ? "A little more present."
        : "Be here, now.";
    }

    const phaseIndex =
      Math.floor(
        seconds / PHASE_SECONDS
      ) % 2;

    return phaseIndex === 0
      ? "Breathe in"
      : "Breathe out";
  }, [active, seconds]);

  const remaining = Math.max(
    TOTAL_SECONDS - seconds,
    0
  );

  function togglePractice() {
    if (active) {
      setRunning(false);
      return;
    }

    setSeconds(0);
    setRunning(true);
  }

  return (
    <div className="renew-breathing">
      <div
        className={`renew-breath-circle ${
          active ? "is-breathing" : ""
        }`}
        data-phase={
          active
            ? phase === "Breathe in"
              ? "inhale"
              : "exhale"
            : "idle"
        }
      >
        <span aria-hidden="true">
          ✧
        </span>

        <p aria-live="polite">
          {phase}
        </p>

        <small>
          {active
            ? `${remaining}s remaining`
            : seconds >=
                TOTAL_SECONDS
              ? "Take this feeling with you"
              : "A 24-second pause"}
        </small>
      </div>

      <button
        type="button"
        onClick={togglePractice}
      >
        {active
          ? "End practice"
          : seconds >=
              TOTAL_SECONDS
            ? "Breathe again"
            : "Begin a mindful moment"}

        <span aria-hidden="true">
          →
        </span>
      </button>

      <small>
        Breathe gently, at a pace that
        feels comfortable.
      </small>
    </div>
  );
}