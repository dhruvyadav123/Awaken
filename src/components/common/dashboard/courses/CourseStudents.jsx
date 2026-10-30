
"use client";

import { useState } from "react";
import {
  Busy, Pager, Status, lightBtn,
  panel, useLoad,
} from "./CourseUI";
import {
  pathForCourse,
  recordId,
  asDate,
} from "./course-api";

export default function CourseStudents({ courseId }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");

  const base = `${pathForCourse(courseId)}/students`;

  const students = useLoad(
    `${base}?page=${page}&limit=20`
  );

  const progress = useLoad(
    selected
      ? `${base}/${encodeURIComponent(selected)}/progress`
      : null
  );

  const rows = Array.isArray(students.data)
    ? students.data
    : students.data?.students || [];

  const data =
    progress.data?.progress || progress.data;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#263e30]">
          Enrolled students
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enrollment information and lesson-by-lesson progress.
        </p>
      </div>

      <section className={panel}>
        <Busy
          state={students}
          empty="No students enrolled yet."
        />

        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={recordId(row)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="break-all text-sm font-semibold text-[#263e30]">
                  Student:{" "}
                  {row.user?.displayName ||
                    row.user?.name ||
                    row.userId}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Enrolled {asDate(row.enrolledAt)} ·{" "}
                  {row.completedLessons || 0}/
                  {row.totalLessons || 0} lessons
                </p>

                <div className="mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#315a48]"
                    style={{
                      width: `${
                        Math.min(
                          100,
                          Math.max(
                            0,
                            Number(
                              row.progressPercent || 0
                            )
                          )
                        )
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-[#315a48]">
                  {row.progressPercent || 0}%
                </span>

                <Status
                  value={row.enrollmentStatus}
                />
              </div>

              <button
                type="button"
                className={lightBtn}
                onClick={() =>
                  setSelected(
                    selected === recordId(row)
                      ? ""
                      : recordId(row)
                  )
                }
              >
                {selected === recordId(row)
                  ? "Close"
                  : "View progress"}
              </button>
            </div>
          ))}
        </div>

        <Pager
          pagination={students.pagination}
          page={page}
          setPage={(next) => {
            setPage(next);
            setSelected("");
          }}
        />
      </section>

      {selected && (
        <section className={panel}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#263e30]">
              Student progress
            </h3>

            <button
              type="button"
              className={lightBtn}
              onClick={() => setSelected("")}
            >
              Close
            </button>
          </div>

          <Busy
            state={progress}
            empty="No progress recorded."
          />

          {data && !progress.loading && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[#f3f7f3] p-4">
                  <p className="text-xs text-slate-500">
                    Completion
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {data.progressPercent || 0}%
                  </p>
                </div>

                <div className="rounded-lg bg-[#f3f7f3] p-4">
                  <p className="text-xs text-slate-500">
                    Lessons
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {data.completedLessons || 0}/
                    {data.totalLessons || 0}
                  </p>
                </div>

                <div className="rounded-lg bg-[#f3f7f3] p-4">
                  <p className="text-xs text-slate-500">
                    Status
                  </p>
                  <div className="mt-2">
                    <Status
                      value={
                        data.enrollmentStatus
                      }
                    />
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Started: {asDate(data.startedAt)} ·{" "}
                Completed: {asDate(data.completedAt)}
              </p>

              <div className="mt-4 space-y-2">
                {(data.lessons || []).map(
                  (lesson) => (
                    <div
                      key={recordId(lesson)}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                    >
                      <p className="break-all text-sm">
                        Lesson: {lesson.lessonId}
                      </p>

                      <Status
                        value={lesson.status}
                      />

                      <span className="text-xs text-slate-500">
                        {asDate(
                          lesson.completedAt ||
                            lesson.lastAccessedAt
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
