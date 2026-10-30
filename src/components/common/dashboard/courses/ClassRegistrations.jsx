
"use client";

import { useState } from "react";

import {
  Busy,
  Note,
  Pager,
  Status,
  btn,
  lightBtn,
  input,
  label,
  panel,
  useLoad,
} from "./CourseUI";

import {
  courseWrite,
  recordId,
  schemas,
  asDate,
} from "./course-api";

export default function ClassRegistrations({
  classId,
}) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");
  const [attendance, setAttendance] =
    useState("PRESENT");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState(
    "Attendance recorded after class"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const base = `facilitator/classes/${encodeURIComponent(
    classId
  )}/registrations`;

  const registrations = useLoad(
    `${base}?page=${page}&limit=20`
  );

  const detail = useLoad(
    selected ? `${base}/${selected}` : null
  );

  const rows = Array.isArray(registrations.data)
    ? registrations.data
    : registrations.data?.registrations || [];

  const active =
    detail.data?.registration || detail.data;

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await courseWrite({
        method: "PATCH",
        path: `${base}/${selected}/attendance`,
        template: schemas.attendance,
        versionPath: `${base}/${selected}`,
        values: {
          status: attendance,
          notes: notes.trim(),
          reason: reason.trim(),
        },
        onConflict: async () => {
          await Promise.all([
            detail.reload(),
            registrations.reload(),
          ]);
        },
      });

      setNotice("Attendance saved.");

      await Promise.all([
        detail.reload(),
        registrations.reload(),
      ]);
    } catch (e) {
      setError(
        e.message || "Could not save attendance"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#263e30]">
          Class registrations
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage participation and attendance.
        </p>
      </div>

      <div className={panel}>
        <Busy
          state={registrations}
          empty="No registrations found."
        />

        <div className="space-y-3">
          {rows.map((item) => (
            <button
              key={recordId(item)}
              type="button"
              onClick={() => {
                setSelected(recordId(item));

                setAttendance(
                  item.attendanceStatus === "UNMARKED"
                    ? "PRESENT"
                    : item.attendanceStatus
                );

                setNotes("");
              }}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-4 text-left hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  Student {item.userId}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Registered{" "}
                  {asDate(item.registeredAt)}
                  {" · "}
                  Joined {item.joinedCount || 0} times
                </p>
              </div>

              <Status value={item.status} />
              <Status
                value={item.attendanceStatus}
              />
            </button>
          ))}
        </div>

        <Pager
          pagination={registrations.pagination}
          page={page}
          setPage={(next) => {
            setPage(next);
            setSelected("");
          }}
        />
      </div>

      {selected && (
        <section className={panel}>
          <div className="flex justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#263e30]">
              Registration details
            </h2>

            <button
              type="button"
              className={lightBtn}
              onClick={() => setSelected("")}
            >
              Close
            </button>
          </div>

          <Busy state={detail} />

          {active && !detail.loading && (
            <>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  Class:{" "}
                  <strong>
                    {active.snapshot?.title ||
                      active.classId}
                  </strong>
                </p>

                <p>
                  Registration:{" "}
                  <strong>{active.status}</strong>
                </p>

                <p>
                  Payment:{" "}
                  <strong>
                    {active.paymentStatus}
                  </strong>
                </p>

                <p>
                  Amount:{" "}
                  <strong>
                    {active.currency}{" "}
                    {active.amountPaid}
                  </strong>
                </p>

                <p>
                  Starts:{" "}
                  <strong>
                    {asDate(
                      active.snapshot?.startsAt
                    )}
                  </strong>
                </p>

                <p>
                  Current attendance:{" "}
                  <strong>
                    {active.attendanceStatus}
                  </strong>
                </p>
              </div>

              <form
                className="mt-5 grid gap-3"
                onSubmit={save}
              >
                <label className={label}>
                  Attendance
                  <select
                    className={input}
                    value={attendance}
                    onChange={(e) =>
                      setAttendance(
                        e.target.value
                      )
                    }
                  >
                    <option value="PRESENT">
                      Present
                    </option>

                    <option value="ABSENT">
                      Absent
                    </option>
                  </select>
                </label>

                <label className={label}>
                  Notes
                  <textarea
                    className={input}
                    rows={3}
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value)
                    }
                  />
                </label>

                <label className={label}>
                  Reason
                  <input
                    className={input}
                    required
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value)
                    }
                  />
                </label>

                <Note
                  error={error}
                  success={notice}
                />

                <button
                  className={btn}
                  disabled={busy}
                >
                  {busy
                    ? "Saving…"
                    : "Save attendance"}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
