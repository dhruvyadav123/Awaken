
"use client";

import { useState } from "react";
import {
  Busy, Note, Pager, Status, btn, lightBtn,
  input, label, panel, useLoad,
} from "./CourseUI";
import {
  courseWrite, pathForCourse, recordId,
  schemas, asDate,
} from "./course-api";
import { accountFetch } from "@/lib/client-account";

function makeQuestion() {
  return {
    prompt: "",
    points: 1,
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ],
  };
}

function toDraft(record) {
  return {
    title: record?.title || "",
    scope: record?.scope || "COURSE",
    status: record?.status || "ACTIVE",
    isRequired: record?.isRequired ?? true,
    passingPercent: record?.passingPercent ?? 70,
    maxAttempts: record?.maxAttempts ?? 3,
    showCorrectAnswers: record?.showCorrectAnswers ?? false,
    questions: record?.questions?.length
      ? record.questions.map((q) => ({
          prompt: q.prompt || "",
          points: q.points ?? 1,
          options: q.options?.map((o) => ({
            text: o.text || "",
            isCorrect: !!o.isCorrect,
          })) || [],
        }))
      : [makeQuestion()],
    reason: "Create or update course assessment",
  };
}

function QuizUpdateForm({ courseId, existing, close, saved }) {
  const [title, setTitle] = useState(existing?.title || "");
  const [reason, setReason] = useState("Update course assessment");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await courseWrite({
        method: "PATCH",
        path: `${pathForCourse(courseId)}/quizzes/${encodeURIComponent(recordId(existing))}`,
        template: schemas.quizItem,
        courseId,
        versionPath: `${pathForCourse(courseId)}/quizzes/${encodeURIComponent(recordId(existing))}`,
        values: { title: title.trim(), reason: reason.trim() },
        onConflict: saved,
      });
      await saved?.(result?.data?.quiz || result?.data);
      close();
    } catch (caught) {
      setError(caught.message || "Quiz update failed.");
    } finally {
      setBusy(false);
    }
  }

  return <form className={`${panel} space-y-4`} onSubmit={submit}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b8c75]">Quiz update</p><h3 className="mt-1 text-lg font-semibold text-[#263e30]">Update assessment</h3></div><button className={lightBtn} type="button" onClick={close}>Close</button></div>
    <p className="text-sm text-slate-500">The facilitator PATCH contract updates the assessment title and reason. Questions and scoring are shown below from the latest GET response.</p>
    <label className={label}>Quiz title<input className={input} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <div className="grid gap-3 rounded-lg border border-[#dfe8e1] bg-[#f8faf8] p-4 text-sm sm:grid-cols-3"><div><span className="block text-xs text-slate-500">Scope</span><strong>{existing?.scope || "—"}</strong></div><div><span className="block text-xs text-slate-500">Questions</span><strong>{existing?.questions?.length || 0}</strong></div><div><span className="block text-xs text-slate-500">Version</span><strong>{existing?.version ?? "—"}</strong></div></div>
    <label className={label}>Reason / change note<input className={input} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
    <Note error={error} />
    <div className="flex flex-wrap justify-end gap-2"><button type="button" className={lightBtn} disabled={busy} onClick={close}>Cancel</button><button disabled={busy} className={btn} type="submit">{busy ? "Saving..." : "Update assessment"}</button></div>
  </form>;
}

function QuizForm({
  courseId,
  existing,
  close,
  saved,
}) {
  const [v, setV] = useState(() => toDraft(existing));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) =>
    setV((old) => ({ ...old, [key]: value }));

  const question = (index, key, value) =>
    update(
      "questions",
      v.questions.map((q, i) =>
        i === index ? { ...q, [key]: value } : q
      )
    );

  const option = (qi, oi, key, value) =>
    update(
      "questions",
      v.questions.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              options: q.options.map((o, j) =>
                j !== oi ? o : { ...o, [key]: value }
              ),
            }
      )
    );

  function correct(qi, oi) {
    update(
      "questions",
      v.questions.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              options: q.options.map((o, j) => ({
                ...o,
                isCorrect: j === oi,
              })),
            }
      )
    );
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const values = {
        ...v,
        passingPercent: Number(v.passingPercent),
        maxAttempts: Number(v.maxAttempts),
        questions: v.questions.map((q) => ({
          prompt: q.prompt.trim(),
          points: Number(q.points),
          options: q.options.map((o) => ({
            text: o.text.trim(),
            isCorrect: !!o.isCorrect,
          })),
        })),
      };

      const base = pathForCourse(courseId);

      const result = await courseWrite({
        method: existing ? "PATCH" : "POST",
        path: existing
          ? `${base}/quizzes/${recordId(existing)}`
          : `${base}/quizzes`,
        template: existing
          ? schemas.quizItem
          : schemas.quiz,
        values,
        courseId,
        versionPath: existing
          ? `${base}/quizzes/${recordId(existing)}`
          : undefined,
        onConflict: saved,
      });

      await saved?.(result?.data?.quiz || result?.data);
      close();
    } catch (e) {
      setError(e.message || "Quiz save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className={`${panel} space-y-4`}
      onSubmit={save}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#263e30]">
          {existing
            ? "Edit assessment"
            : "Create assessment"}
        </h3>

        <button
          className={lightBtn}
          type="button"
          onClick={close}
        >
          Close
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          Quiz title
          <input
            className={input}
            value={v.title}
            onChange={(e) =>
              update("title", e.target.value)
            }
          />
        </label>

        <label className={label}>
          Quiz scope
          <input className={input} value="COURSE" readOnly />
        </label>

        <label className={label}>
          Pass percentage
          <input
            type="number"
            min="0"
            max="100"
            className={input}
            value={v.passingPercent}
            onChange={(e) =>
              update(
                "passingPercent",
                e.target.value
              )
            }
          />
        </label>

        <label className={label}>
          Maximum attempts
          <input
            type="number"
            min="1"
            className={input}
            value={v.maxAttempts}
            onChange={(e) =>
              update("maxAttempts", e.target.value)
            }
          />
        </label>

        <label className={label}>
          Status
          <select
            className={input}
            value={v.status}
            onChange={(e) =>
              update("status", e.target.value)
            }
          >
            <option>ACTIVE</option>
            <option>DRAFT</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={v.isRequired}
              onChange={(e) =>
                update(
                  "isRequired",
                  e.target.checked
                )
              }
            />
            Required
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={v.showCorrectAnswers}
              onChange={(e) =>
                update(
                  "showCorrectAnswers",
                  e.target.checked
                )
              }
            />
            Show answers
          </label>
        </div>
      </div>

      <h4 className="border-b border-[#e7eee8] pb-2 font-semibold text-[#263e30]">
        Questions
      </h4>

      {v.questions.map((q, qi) => (
        <section
          key={qi}
          className="rounded-lg border border-[#dfe8e1] p-4"
        >
          <div className="flex flex-wrap justify-between gap-3">
            <span className="font-semibold text-[#315a48]">
              Question {qi + 1}
            </span>

            <button
              type="button"
              className={lightBtn}
              disabled={v.questions.length === 1}
              onClick={() =>
                update(
                  "questions",
                  v.questions.filter(
                    (_, i) => i !== qi
                  )
                )
              }
            >
              Remove question
            </button>
          </div>

          <label className={`${label} mt-3`}>
            Question text
            <textarea
              className={input}
              value={q.prompt}
              onChange={(e) =>
                question(
                  qi,
                  "prompt",
                  e.target.value
                )
              }
            />
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Points
              <input
                className={input}
                type="number"
                min="1"
                value={q.points}
                onChange={(e) =>
                  question(
                    qi,
                    "points",
                    e.target.value
                  )
                }
              />
            </label>

          </div>

          <p className="my-3 text-xs text-slate-500">
            Select one correct answer.
          </p>

          <div className="space-y-2">
            {q.options.map((o, oi) => (
              <div
                key={oi}
                className="flex min-w-0 items-center gap-2"
              >
                <input
                  type="radio"
                  checked={!!o.isCorrect}
                  name={`correct-${qi}`}
                  onChange={() =>
                    correct(qi, oi)
                  }
                  aria-label={`Option ${
                    oi + 1
                  } is correct`}
                />

                <input
                  className={`${input} !mt-0 flex-1`}
                  value={o.text}
                  placeholder={`Option ${oi + 1}`}
                  onChange={(e) =>
                    option(
                      qi,
                      oi,
                      "text",
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className={lightBtn}
                  disabled={
                    q.options.length <= 2
                  }
                  onClick={() =>
                    question(
                      qi,
                      "options",
                      q.options.filter(
                        (_, i) => i !== oi
                      )
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`${lightBtn} mt-3`}
            onClick={() =>
              question(
                qi,
                "options",
                [
                  ...q.options,
                  {
                    text: "",
                    isCorrect: false,
                  },
                ]
              )
            }
          >
            + Add option
          </button>
        </section>
      ))}

      <button
        type="button"
        className={lightBtn}
        onClick={() =>
          update(
            "questions",
            [...v.questions, makeQuestion()]
          )
        }
      >
        + Add question
      </button>

      <label className={label}>
        Reason / change note
        <input
          className={input}
          value={v.reason}
          onChange={(e) =>
            update("reason", e.target.value)
          }
        />
      </label>

      <Note error={error} />

      <button
        disabled={busy}
        className={btn}
        type="submit"
      >
        {busy
          ? "Saving…"
          : "Save assessment"}
      </button>
    </form>
  );
}

export default function CourseAssessments({
  courseId,
  course,
}) {
  const base = pathForCourse(courseId);

  const [page, setPage] = useState(1);
  const [attemptPage, setAttemptPage] = useState(1);

  const quizzes = useLoad(
    `${base}/quizzes?page=${page}&limit=20`
  );

  const attempts = useLoad(
    `${base}/quiz-attempts?page=${attemptPage}&limit=20`
  );

  const [form, setForm] = useState(undefined);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingQuiz, setLoadingQuiz] = useState("");
  const [activeAttempt, setActiveAttempt] = useState(null);

  const list = Array.isArray(quizzes.data)
    ? quizzes.data
    : quizzes.data?.quizzes || [];

  const history = Array.isArray(attempts.data)
    ? attempts.data
    : attempts.data?.attempts ||
      attempts.data?.quizAttempts ||
      [];

  async function edit(record) {
    setError("");
    setLoadingQuiz(recordId(record));

    try {
      const result = await accountFetch(
        `${base}/quizzes/${recordId(record)}`
      );

      setForm(
        result.data?.quiz || result.data
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingQuiz("");
    }
  }

  async function refreshed() {
    await Promise.all([
      quizzes.reload(),
      attempts.reload(),
    ]);

    setSuccess("Assessment saved.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#263e30]">
            Assessments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create quizzes, set passing criteria
            and review student attempts.
          </p>
        </div>

        <button
          className={btn}
          type="button"
          onClick={() => setForm(null)}
        >
          + Create quiz
        </button>
      </div>

      {course?.completionPolicy?.requirePassingQuizzes && (
        <p className="text-sm text-amber-800">
          Course completion requires passing quizzes.
          Make your required quizzes ACTIVE before submitting.
        </p>
      )}

      <Note error={error} success={success} />

      {form !== undefined && (
        form ? (
          <QuizUpdateForm
            key={recordId(form)}
            courseId={courseId}
            existing={form}
            close={() => setForm(undefined)}
            saved={refreshed}
          />
        ) : (
          <QuizForm
            key="create"
            courseId={courseId}
            existing={null}
            close={() => setForm(undefined)}
            saved={refreshed}
          />
        )
      )}

      <section className={panel}>
        <h3 className="font-semibold text-[#263e30]">
          Course quizzes
        </h3>

        <Busy
          state={quizzes}
          empty="No quizzes created."
        />

        <div className="mt-3 space-y-3">
          {list.map((item) => (
            <div
              key={recordId(item)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
            >
              <div className="min-w-0">
                <h4 className="break-words font-semibold text-[#294b38]">
                  {item.title}
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Pass {item.passingPercent}% ·{" "}
                  {item.questions?.length || 0} questions ·{" "}
                  {item.maxAttempts} attempts
                </p>
              </div>

              <Status value={item.status} />

              <button
                type="button"
                className={lightBtn}
                disabled={!!loadingQuiz}
                onClick={() => edit(item)}
              >
                {loadingQuiz === recordId(item)
                  ? "Loading…"
                  : "View / edit"}
              </button>
            </div>
          ))}
        </div>

        <Pager
          pagination={quizzes.pagination}
          page={page}
          setPage={setPage}
        />
      </section>

      <section className={panel}>
        <h3 className="font-semibold text-[#263e30]">
          Student quiz attempts
        </h3>

        <Busy
          state={attempts}
          empty="No attempts submitted."
        />

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3">Assessment</th>
                <th>Attempt</th>
                <th>Score</th>
                <th>Result</th>
                <th>Submitted</th>
              </tr>
            </thead>

            <tbody>
              {history.map((a) => (
                <tr
                  key={recordId(a)}
                  className="border-b border-slate-100"
                >
                  <td className="py-3">
                    {a.quizTitle || a.quizId}
                  </td>
                  <td>{a.attemptNumber}</td>
                  <td>{a.percent ?? "—"}%</td>
                  <td>
                    <Status
                      value={
                        a.passed
                          ? "PASSED"
                          : "FAILED"
                      }
                    />
                  </td>
                  <td>
                    {asDate(a.submittedAt)}
                    {" "}
                    <button
                      type="button"
                      className="ml-2 text-[#315a48] underline"
                      onClick={() =>
                        setActiveAttempt(
                          activeAttempt?.id === recordId(a)
                            ? null
                            : a
                        )
                      }
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activeAttempt && (
          <div className="mt-4 rounded-lg border border-[#dbe6de] bg-[#f8faf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold">
                Attempt {activeAttempt.attemptNumber} ·{" "}
                {activeAttempt.percent}%
              </h4>

              <button
                type="button"
                className={lightBtn}
                onClick={() =>
                  setActiveAttempt(null)
                }
              >
                Close
              </button>
            </div>

            <p className="mt-2 break-all text-xs text-slate-600">
              Student: {activeAttempt.userId}
            </p>

            <div className="mt-3 space-y-2">
              {(activeAttempt.answers || []).map(
                (a, i) => {
                  const quiz = list.find(
                    (q) =>
                      recordId(q) ===
                      activeAttempt.quizId
                  );

                  const question =
                    quiz?.questions?.find(
                      (q) =>
                        recordId(q) === a.questionId
                    );

                  const answer =
                    question?.options?.find(
                      (o) =>
                        recordId(o) === a.optionId
                    );

                  return (
                    <p
                      key={i}
                      className="break-all rounded-md bg-white p-3 text-sm"
                    >
                      {question?.prompt ||
                        `Question ${a.questionId}`}
                      {" — "}
                      {answer?.text ||
                        `Option ${a.optionId}`}
                      {" · "}
                      {a.points} point(s) ·{" "}
                      {a.correct
                        ? "Correct"
                        : "Incorrect"}
                    </p>
                  );
                }
              )}
            </div>
          </div>
        )}

        <Pager
          pagination={attempts.pagination}
          page={attemptPage}
          setPage={setAttemptPage}
        />
      </section>
    </div>
  );
}
