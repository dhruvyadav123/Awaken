
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Video,
} from "lucide-react";

import SessionSlotAction from "@/components/sessions/SessionSlotAction";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDay(value, timezone) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localDay(value, timezone) {
  if (!value) return "";

  try {
    const date = new Date(value);

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const part = (type) =>
      parts.find((item) => item.type === type)?.value || "";

    return `${part("year")}-${part("month")}-${part("day")}`;
  } catch {
    return "";
  }
}

function formatTime(value, timezone) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

function makeMonthLink(year, month, rescheduleBookingId) {
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));

  const params = new URLSearchParams({
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  });

  if (rescheduleBookingId) {
    params.set("reschedule", rescheduleBookingId);
  }

  return `?${params.toString()}`;
}

function normalizeSlot(slot, index, timezone) {
  const startsAt =
    slot.startsAt ||
    slot.startAt ||
    slot.start ||
    slot.from ||
    "";

  const endsAt =
    slot.endsAt ||
    slot.endAt ||
    slot.end ||
    slot.to ||
    "";

  const day =
    localDay(startsAt, timezone) ||
    (typeof slot.date === "string" ? slot.date.slice(0, 10) : "");

  return {
    ...slot,
    startsAt,
    endsAt,
    day,
    key: `${slot.availabilityId || slot.id || index}-${startsAt}`,
  };
}

export default function SessionBookingPanel({
  session,
  slots = [],
  timezone = "Asia/Kolkata",
  year,
  month,
  error,
  rescheduleBookingId = "",
}) {
  const normalizedSlots = useMemo(
    () =>
      slots
        .map((slot, index) => normalizeSlot(slot, index, timezone))
        .filter(
          (slot) =>
            slot.startsAt &&
            slot.day &&
            slot.available !== false &&
            slot.remainingCapacity !== 0 &&
            Number(slot.seatsAvailable ?? 1) > 0
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [slots, timezone]
  );

  const availableDays = useMemo(
    () => new Set(normalizedSlots.map((slot) => slot.day)),
    [normalizedSlots]
  );

  const initialDay = normalizedSlots[0]?.day || "";

  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");

  const effectiveDay = availableDays.has(selectedDay)
    ? selectedDay
    : initialDay;

  const daySlots = normalizedSlots.filter(
    (slot) => slot.day === effectiveDay
  );

  const selectedSlot =
    daySlots.find((slot) => slot.key === selectedSlotKey) ||
    null;

  const firstWeekday = new Date(
    Date.UTC(year, month - 1, 1)
  ).getUTCDay();

  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const monthTitle = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const nextDate = new Date(Date.UTC(year, month, 1));

  const selectedDateTitle = effectiveDay
    ? new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${effectiveDay}T00:00:00Z`))
    : "";

  const today = formatDay(new Date().toISOString(), timezone);

  return (
    <div className="rounded-[22px] border border-[#E6EBE7] bg-white p-5 shadow-[0_10px_40px_rgba(12,54,42,0.035)] sm:p-7">
      <div className="mb-7">
        <h2 className="font-[Georgia,serif] text-[27px] leading-tight tracking-[-0.025em] text-[#172C26]">
          {rescheduleBookingId
            ? "Reschedule your session"
            : "Book your session"}
        </h2>

        <p className="mt-2 text-sm text-[#7B8780]">
          Choose a date and time to continue.
        </p>
      </div>

      <div className="rounded-xl border border-[#E8EDE9] p-3 sm:p-4">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href={makeMonthLink(
              prevDate.getUTCFullYear(),
              prevDate.getUTCMonth(),
              rescheduleBookingId
            )}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#314C40] hover:bg-[#EEF5EF]"
          >
            <ChevronLeft size={19} />
          </Link>

          <h3 className="text-sm font-semibold text-[#1B2F27]">
            {monthTitle}
          </h3>

          <Link
            href={makeMonthLink(
              nextDate.getUTCFullYear(),
              nextDate.getUTCMonth(),
              rescheduleBookingId
            )}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#314C40] hover:bg-[#EEF5EF]"
          >
            <ChevronRight size={19} />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center">
          {WEEKDAYS.map((day) => (
            <span
              key={day}
              className="py-2 text-[11px] font-medium text-[#8B958F]"
            >
              {day}
            </span>
          ))}

          {Array.from({ length: firstWeekday }, (_, index) => (
            <span key={`empty-${index}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const dayNumber = index + 1;

            const day = [
              String(year),
              String(month).padStart(2, "0"),
              String(dayNumber).padStart(2, "0"),
            ].join("-");

            const available = availableDays.has(day);
            const active = effectiveDay === day;
            const past = day < today;

            return (
              <button
                key={day}
                type="button"
                disabled={!available || past}
                onClick={() => {
                  setSelectedDay(day);
                  setSelectedSlotKey("");
                }}
                aria-pressed={active}
                aria-label={`${day}${available ? ", available" : ", unavailable"}`}
                className={[
                  "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition",
                  active
                    ? "bg-[#104F43] font-semibold text-white shadow-md"
                    : available && !past
                      ? "bg-[#E7F3E9] font-semibold text-[#165745] hover:bg-[#D3E9D8]"
                      : "cursor-not-allowed text-[#B0B8B2]",
                ].join(" ")}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#1A2D25]">
            Available times
          </h3>

          {effectiveDay && (
            <span className="text-xs text-[#7A887E]">
              {selectedDateTitle}
            </span>
          )}
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-[#FFF5F1] p-4 text-sm text-[#965643]">
            {error}
          </p>
        ) : daySlots.length ? (
          <div className="space-y-2.5">
            {daySlots.map((slot) => {
              const active = selectedSlot?.key === slot.key;

              return (
                <button
                  key={slot.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedSlotKey(slot.key)}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition",
                    active
                      ? "border-[#277C55] bg-[#F1F8F2]"
                      : "border-[#E7EBE8] bg-white hover:border-[#A5C9B5] hover:bg-[#FBFDFB]",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Clock3
                      size={19}
                      className={active ? "text-[#175E46]" : "text-[#89948D]"}
                    />

                    <div>
                      <span className="block text-[13px] font-semibold text-[#20352B] sm:text-sm">
                        {formatTime(slot.startsAt, timezone)}
                        {" – "}
                        {formatTime(slot.endsAt, timezone)}
                      </span>

                      <span className="mt-1 block text-xs text-[#8B968D]">
                        {session.durationMinutes || session.duration || 30} min session
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden rounded-md bg-[#E5F4E8] px-2.5 py-1 text-[11px] text-[#257548] sm:inline">
                      {slot.seatsAvailable} seat
                      {Number(slot.seatsAvailable) === 1 ? "" : "s"}
                    </span>

                    <span
                      className={[
                        "flex h-5 w-5 items-center justify-center rounded-full border-2",
                        active
                          ? "border-[#145B44] bg-[#145B44] text-white"
                          : "border-[#A9B4AD]",
                      ].join(" ")}
                    >
                      {active && <Check size={12} strokeWidth={3} />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#DFE8E0] px-4 py-9 text-center">
            <CalendarDays
              size={25}
              className="mx-auto text-[#98ADA0]"
            />
            <p className="mt-3 text-sm text-[#7B8880]">
              No available slots for this date.
            </p>
            <p className="mt-1 text-xs text-[#9AA59D]">
              Choose another available date.
            </p>
          </div>
        )}
      </div>

      <div className="mt-7">
        {selectedSlot ? (
          <div className="session-booking-action">
            <SessionSlotAction
              key={selectedSlot.key}
              sessionTypeId={session.id}
              availabilityId={
                selectedSlot.availabilityId ||
                selectedSlot.id ||
                selectedSlot._id
              }
              startsAt={selectedSlot.startsAt}
              rescheduleBookingId={rescheduleBookingId}
            />
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#A9BDB1] text-sm font-semibold text-white"
          >
            Select a time to continue
            <ArrowRight size={17} />
          </button>
        )}

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-[#98A29B]">
          <Video size={13} />
          {String(session.mode || "").toUpperCase() === "ONLINE"
            ? "Online session"
            : session.mode || "Guided session"}
          <span>·</span>
          Times in {timezone}
        </p>
      </div>
    </div>
  );
}
