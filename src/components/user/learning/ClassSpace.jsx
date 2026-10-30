
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RecordMedia } from "@/components/common/ApiRecordDisplay";
import {
  registrationVersion,
  joinMessage,
  formatSchedule,
} from "@/lib/student-flow";
import { accountFetch } from "@/lib/client-account";
import { dataOf, externalUrl, titleOf } from "@/lib/learning-data";
import { recordMedia } from "@/lib/record-display";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#28533d] px-5 text-center text-sm font-semibold leading-5 text-white transition hover:bg-[#1d3e2e] disabled:cursor-not-allowed disabled:opacity-50";

const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#eef4ee] px-5 text-center text-sm font-semibold leading-5 text-[#28533d] transition hover:bg-[#e2ede2] disabled:cursor-not-allowed disabled:opacity-50";

const field =
  "mt-2 w-full rounded-xl border border-[#dde7dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#719d7b]";

const upper = (v) => String(v || "").toUpperCase();

export default function ClassSpace({ classId }) {
  const pathname = usePathname();
  const seq = useRef(0);
  const lock = useRef(false);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [notice, setNotice] = useState("");
  const [links, setLinks] = useState({});
  const [reason, setReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [registeredAfterAction, setRegisteredAfterAction] = useState(false);

  const load = useCallback(async () => {
    const current = ++seq.current;

    setLoading(true);
    setError("");
    setErrorStatus(null);

    try {
      const response = await accountFetch(
        `me/classes/${encodeURIComponent(classId)}`
      );

      if (current !== seq.current) return;

      const value = dataOf(response);

      setItem(
        value?.class
          ? {
              ...value.class,
              registration:
                value.registration ?? value.class.registration,
              registrationStatus:
                value.registrationStatus ??
                value.class.registrationStatus,
            }
          : value
      );
    } catch (e) {
      if (current !== seq.current) return;

      setItem(null);
      setError(e?.message || "Class details could not be loaded.");
      setErrorStatus(e?.status ?? null);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void load();

    return () => {
      seq.current += 1;
    };
  }, [load]);

  async function act(kind, run) {
    if (lock.current) return;

    lock.current = true;
    setWorking(kind);
    setError("");
    setNotice("");

    try {
      await run();
    } catch (e) {
      setError(e?.message || "Please try again.");
    } finally {
      lock.current = false;
      setWorking("");
    }
  }

  const status = upper(
    item?.registrationStatus || item?.registration?.status
  );

  const cancelled = ["CANCELLED", "CANCELED"].includes(status);

  const registered =
    !cancelled &&
    (registeredAfterAction ||
      item?.isRegistered === true ||
      item?.registered === true ||
      item?.registrationId != null ||
      item?.registration?.id != null ||
      [
        "REGISTERED",
        "CONFIRMED",
        "WAITLISTED",
        "BOOKED",
        "ACTIVE",
      ].includes(status));

  const version = item ? registrationVersion(item) : null;

  const canJoin =
    registered &&
    item?.hasAccess === true &&
    item?.join?.available === true;

  const canWatch =
    registered &&
    item?.hasAccess === true &&
    item?.recordingAvailable === true;

  const canCancel =
    registered && item?.canCancel !== false && version != null;

  const hasCover =
    item && recordMedia(item, { imagesOnly: true }).length > 0;

  const summary = item?.shortDescription || item?.description;

  const time = item?.startsAt
    ? formatSchedule(item.startsAt, item.timezone)
    : "";

  const end = item?.endsAt
    ? formatSchedule(item.endsAt, item.timezone)
    : "";

  const price = item?.regularPrice ?? item?.price ?? item?.amount;
  const facts = [
    item?.mode && ["Mode", upper(item.mode)],
    price != null && price !== "" && ["Price", Number(price) === 0 ? "Free" : `${item.currency || "INR"} ${price}`],
    (item?.facilitatorName || item?.facilitator?.name) && ["Facilitator", item.facilitatorName || item.facilitator.name],
    item?.availableSeats != null && ["Seats left", String(item.availableSeats)],
  ].filter(Boolean);

  async function register() {
    await act("register", async () => {
      const response = await accountFetch(
        `me/classes/${encodeURIComponent(classId)}/registrations`,
        {
          method: "POST",
          body: {},
        }
      );

      const received = upper(
        dataOf(response)?.status || response?.data?.status
      );

      setRegisteredAfterAction(
        !["CANCELLED", "CANCELED"].includes(received)
      );

      setNotice(
        response?.message || "Registration request submitted."
      );

      await load();
    });
  }

  async function cancel(event) {
    event.preventDefault();

    if (!reason.trim() || !canCancel) return;

    await act("cancel", async () => {
      const current = await accountFetch(
        `me/classes/${encodeURIComponent(classId)}`
      );

      const data = dataOf(current);

      const latest = data?.class
        ? {
            ...data.class,
            registration:
              data.registration ?? data.class.registration,
            registrationVersion:
              data.registrationVersion ??
              data.class.registrationVersion,
          }
        : data;

      const latestVersion = registrationVersion(latest);

      if (latestVersion == null) {
        throw new Error(
          "Registration version is unavailable. Refresh and retry."
        );
      }

      const response = await accountFetch(
        `me/classes/${encodeURIComponent(classId)}/cancel`,
        {
          method: "POST",
          body: {
            version: latestVersion,
            reason: reason.trim(),
          },
        }
      );

      setNotice(
        response?.message || "Cancellation request submitted."
      );

      setReason("");
      setShowCancel(false);
      setRegisteredAfterAction(false);
      setLinks({});

      await load();
    });
  }

  async function getLink(kind) {
    await act(kind, async () => {
      const response = await accountFetch(
        `me/classes/${encodeURIComponent(classId)}/${kind}`
      );

      const value = dataOf(response);

      const url =
        externalUrl(value) || externalUrl(value?.[kind]);

      if (!url) {
        throw new Error(
          kind === "join"
            ? "Joining link is not available yet."
            : "Recording is not available yet."
        );
      }

      setLinks((old) => ({
        ...old,
        [kind]: url,
      }));
    });
  }

  return (
    <main className="min-h-[65vh] bg-white px-5 pb-20 pt-8 text-[#253d2e] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/classes"
          className="text-sm font-medium text-[#557361] hover:underline"
        >
          ← Browse classes
        </Link>

        {loading ? (
          <div
            role="status"
            className="mt-9 animate-pulse space-y-4"
          >
            <div className="h-9 w-2/3 rounded bg-[#f0f4ee]" />
            <div className="h-52 rounded-2xl bg-[#f0f4ee]" />
            <span className="sr-only">Loading class details</span>
          </div>
        ) : (
          <>
            <div className="mt-7 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#78907b]">
                  My class / workshop
                </p>

                <h1 className="mt-2 font-[Georgia,serif] text-3xl leading-tight sm:text-4xl">
                  {titleOf(item, "Class registration")}
                </h1>

                {time && (
                  <p className="mt-3 text-sm leading-6 text-[#617766]">
                    {time}
                    {end ? ` — ${end}` : ""}
                  </p>
                )}
              </div>
              {facts.length > 0 && (
                <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-[#e4ece3] py-4 text-sm sm:grid-cols-4">
                  {facts.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#7a907d]">{label}</dt>
                      <dd className="mt-1 font-medium text-[#345742]">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {status && (
                <span className="rounded-full bg-[#edf5ed] px-3 py-1.5 text-xs font-semibold text-[#376247]">
                  {status.replaceAll("_", " ")}
                </span>
              )}
            </div>

            {notice && (
              <p
                role="status"
                className="mt-6 rounded-xl bg-[#edf7ef] px-4 py-3 text-sm text-[#2f724a]"
              >
                {notice}
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="mt-6 rounded-xl bg-[#fff3ef] px-4 py-3 text-sm text-[#9c4c3c]"
              >
                {error}

                {errorStatus === 401 && (
                  <Link
                    className="ml-2 font-semibold underline"
                    href={`/auth/login?next=${encodeURIComponent(
                      pathname
                    )}`}
                  >
                    Sign in
                  </Link>
                )}
              </p>
            )}

            {(item || errorStatus === 404) && (
              <div className="mt-7 grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
                <div className="min-w-0 space-y-8">
                  {hasCover && (
                    <div className="max-h-[340px] overflow-hidden rounded-2xl bg-[#f3f6f1] [&_img]:max-h-[340px] [&_img]:w-full [&_img]:object-cover">
                      <RecordMedia
                        record={item}
                        imagesOnly
                        compact
                      />
                    </div>
                  )}

                  {summary && (
                    <section>
                      <h2 className="text-lg font-semibold">
                        About this class
                      </h2>

                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#67796b]">
                        {summary}
                      </p>
                    </section>
                  )}

                  {item && joinMessage(item) && (
                    <p className="rounded-xl bg-[#f6f8f4] px-4 py-3 text-sm leading-6 text-[#607564]">
                      {joinMessage(item)}
                    </p>
                  )}

                  {links.recording && (
                    <section>
                      <h2 className="mb-3 text-lg font-semibold">
                        Class recording
                      </h2>

                      <div className="overflow-hidden rounded-xl bg-[#f3f6f2] p-2">
                        <RecordMedia
                          scope="learner"
                          record={{
                            videoUrl: links.recording,
                          }}
                        />
                      </div>

                      <a
                        href={links.recording}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-semibold text-[#2b6246] hover:underline"
                      >
                        Open recording ↗
                      </a>
                    </section>
                  )}

                  {registered && canCancel && (
                    <section>
                      <button
                        type="button"
                        onClick={() =>
                          setShowCancel((v) => !v)
                        }
                        className="text-sm font-medium text-[#98584b] hover:underline"
                      >
                        {showCancel
                          ? "Close cancellation"
                          : "Cancel registration"}
                      </button>

                      {showCancel && (
                        <form
                          onSubmit={cancel}
                          className="mt-4 max-w-lg rounded-xl bg-[#f8faf7] p-5"
                        >
                          <label className="block text-sm font-medium">
                            Reason for cancellation

                            <textarea
                              required
                              maxLength={500}
                              rows={3}
                              value={reason}
                              onChange={(e) =>
                                setReason(e.target.value)
                              }
                              className={field}
                              placeholder="Enter your reason"
                            />
                          </label>

                          <button
                            type="submit"
                            disabled={
                              Boolean(working) ||
                              !reason.trim()
                            }
                            className={`${primary} mt-4`}
                          >
                            {working === "cancel"
                              ? "Submitting…"
                              : "Confirm cancellation"}
                          </button>
                        </form>
                      )}
                    </section>
                  )}
                </div>

                <aside className="rounded-2xl bg-[#f6f8f4] p-5 lg:sticky lg:top-24">
                  <h2 className="text-base font-semibold">
                    Your class access
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#738577]">
                    {registered
                      ? status === "WAITLISTED"
                        ? "You are on the waitlist."
                        : "Your registration is recorded."
                      : "Register to access this class."}
                  </p>

                  <div className="mt-5 space-y-2.5">
                    {!registered &&
                      (item || errorStatus === 404) &&
                      errorStatus !== 401 && (
                        <button
                          type="button"
                          disabled={Boolean(working)}
                          onClick={register}
                          className={`${primary} w-full`}
                        >
                          {working === "register"
                            ? "Registering…"
                            : cancelled
                            ? "Register again"
                            : "Register for class"}
                        </button>
                      )}

                    {canJoin && (
                      <button
                        type="button"
                        disabled={Boolean(working)}
                        onClick={() => getLink("join")}
                        className={`${primary} w-full`}
                      >
                        {working === "join"
                          ? "Getting link…"
                          : "Get joining link"}
                      </button>
                    )}

                    {links.join && (
                      <a
                        className={`${secondary} w-full`}
                        href={links.join}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open live class ↗
                      </a>
                    )}

                    {canWatch && (
                      <button
                        type="button"
                        disabled={Boolean(working)}
                        onClick={() => getLink("recording")}
                        className={`${secondary} w-full`}
                      >
                        {working === "recording"
                          ? "Loading…"
                          : "Watch recording"}
                      </button>
                    )}

                    {item && (
                      <button
                        type="button"
                        onClick={() => void load()}
                        disabled={Boolean(working)}
                        className="w-full py-2 text-xs font-semibold text-[#52735c] hover:underline"
                      >
                        Refresh class status
                      </button>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
