
"use client";

import { useState } from "react";
import {
  Busy, Note, Pager, Status, btn,
  lightBtn, input, label, panel, useLoad,
} from "./CourseUI";

import {
  courseWrite, pathForCourse,
  recordId, schemas, asDate,
} from "./course-api";

export default function CourseQuestions({ courseId }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const base = `${pathForCourse(courseId)}/questions`;

  const questions = useLoad(
    `${base}?page=${page}&limit=20`
  );

  const detail = useLoad(
    selected ? `${base}/${selected}` : null
  );

  const rows = Array.isArray(questions.data)
    ? questions.data
    : questions.data?.questions || [];

  const record =
    detail.data?.question || detail.data;

  async function reply(event) {
    event.preventDefault();

    if (!selected || !answer.trim() || sending)
      return;

    setSending(true);
    setError("");
    setNotice("");

    try {
      await courseWrite({
        method: "POST",
        path: `${base}/${selected}/replies`,
        template: schemas.reply,
        values: {
          body: answer.trim(),
        },
        versionPath: `${base}/${selected}`,
        onConflict: async () => {
          await Promise.all([
            detail.reload(),
            questions.reload(),
          ]);
        },
      });

      setAnswer("");
      setNotice("Reply sent successfully.");

      await Promise.all([
        detail.reload(),
        questions.reload(),
      ]);
    } catch (e) {
      setError(
        e.message || "Could not send reply"
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#263e30]">
          Student questions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Open questions, lesson references
          and your replies.
        </p>
      </div>

      <section className={panel}>
        <Busy
          state={questions}
          empty="No questions yet."
        />

        <div className="space-y-2">
          {rows.map((q) => (
            <button
              type="button"
              key={recordId(q)}
              onClick={() => {
                setSelected(recordId(q));
                setAnswer("");
                setError("");
                setNotice("");
              }}
              className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-left ${
                selected === recordId(q)
                  ? "border-[#315a48] bg-[#f1f7f2]"
                  : "border-slate-100 hover:bg-[#f7faf7]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-medium text-[#263e30]">
                  {q.body}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {q.lessonTitle || q.lessonId}
                  {" · "}
                  {asDate(q.createdAt)}
                </p>
              </div>

              <Status value={q.status} />
            </button>
          ))}
        </div>

        <Pager
          pagination={questions.pagination}
          page={page}
          setPage={(next) => {
            setPage(next);
            setSelected("");
          }}
        />
      </section>

      {selected && (
        <section className={panel}>
          <div className="flex flex-wrap justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#263e30]">
              Question details
            </h3>

            <button
              className={lightBtn}
              type="button"
              onClick={() => setSelected("")}
            >
              Close
            </button>
          </div>

          <Busy state={detail} />

          {record && !detail.loading && (
            <>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#35483b]">
                {record.body}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Lesson:{" "}
                {record.lessonTitle || record.lessonId}
                {" · "}Asked {asDate(record.createdAt)}
              </p>

              <div className="mt-5 space-y-3">
                {(record.replies || []).map((r) => (
                  <article
                    key={recordId(r)}
                    className="rounded-lg bg-[#f3f7f3] p-4"
                  >
                    <p className="text-xs font-semibold text-[#315a48]">
                      {r.authorRole || "FACILITATOR"}
                      {" · "}
                      {asDate(r.createdAt)}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                      {r.body}
                    </p>
                  </article>
                ))}
              </div>

              <form
                onSubmit={reply}
                className="mt-5"
              >
                <label className={label}>
                  Your reply
                  <textarea
                    className={input}
                    required
                    rows={4}
                    value={answer}
                    onChange={(e) =>
                      setAnswer(e.target.value)
                    }
                  />
                </label>

                <Note
                  error={error}
                  success={notice}
                />

                <button
                  className={`${btn} mt-3`}
                  disabled={sending}
                >
                  {sending
                    ? "Sending…"
                    : "Send reply"}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
