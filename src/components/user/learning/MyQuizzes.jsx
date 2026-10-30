
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { accountFetch } from "@/lib/client-account";
import {
  dataOf,
  listOf,
  titleOf,
} from "@/lib/learning-data";
import { formatSchedule } from "@/lib/student-flow";
import { Pagination } from "@/components/common/dashboard/Elements";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#315a48] px-5 text-sm font-semibold text-white transition hover:bg-[#254737] disabled:cursor-not-allowed disabled:opacity-50";

const outline =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#cedbcf] bg-white px-5 text-sm font-semibold text-[#315a48] transition hover:bg-[#f5f8f5] disabled:cursor-not-allowed disabled:opacity-50";

const sectionBorder = "border-[#e3eae4]";

function questionsOf(value) {
  return listOf(value, ["questions", "items"]);
}

function optionsOf(value) {
  return listOf(value, ["options", "choices"]);
}

function statusText(value) {
  const status = String(value || "")
    .replaceAll("_", " ")
    .toLowerCase();

  return status
    ? status.replace(/\b\w/g, (character) =>
        character.toUpperCase()
      )
    : "In progress";
}

function statusTone(value) {
  const normalized = String(
    value || ""
  ).toUpperCase();

  if (
    [
      "PASSED",
      "COMPLETED",
      "GRADED",
    ].includes(normalized)
  ) {
    return "bg-[#e9f4eb] text-[#326645]";
  }

  if (
    [
      "FAILED",
      "EXPIRED",
      "CANCELLED",
    ].includes(normalized)
  ) {
    return "bg-[#fbeeee] text-[#985449]";
  }

  return "bg-[#fff4df] text-[#856027]";
}

function Status({ value }) {
  if (!value) return null;

  return (
    <span
      data-status={String(value).toUpperCase()}
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(value)}`}
    >
      {statusText(value)}
    </span>
  );
}

function ArrowIcon({ direction = "right" }) {
  return (
    <svg
      aria-hidden="true"
      className={direction === "left" ? "-rotate-180" : ""}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.8-4.6L3 9" />
      <path d="M3 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.8 4.6L21 15" />
      <path d="M21 20v-5h-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function QuizMark({ compact = false }) {
  return (
    <span
      aria-hidden="true"
      className={`quiz-mark ${compact ? "quiz-mark-compact" : ""}`}
    >
      <span>Q</span>
    </span>
  );
}

function textOfQuestion(value) {
  return (
    value?.prompt ||
    value?.body ||
    value?.text ||
    value?.title ||
    "Question"
  );
}

function textOfOption(value) {
  if (typeof value === "string") {
    return value;
  }

  return (
    value?.text ||
    value?.body ||
    value?.label ||
    value?.title ||
    ""
  );
}

function idOfQuestion(value) {
  return value?.id || value?.questionId || null;
}

function idOfOption(value) {
  return value?.id || value?.optionId || null;
}

function attemptedQuestions(attempt, quiz) {
  const fromAttempt = questionsOf(attempt);

  if (fromAttempt.length) {
    return fromAttempt;
  }

  const fromEmbeddedQuiz = questionsOf(
    attempt?.quiz
  );

  return fromEmbeddedQuiz.length
    ? fromEmbeddedQuiz
    : questionsOf(quiz);
}

function previousAnswers(attempt) {
  const result = {};
  const saved = attempt?.answers;

  if (Array.isArray(saved)) {
    for (const answer of saved) {
      const questionId =
        answer?.questionId ||
        answer?.question?.id;

      const optionId =
        answer?.optionId ||
        answer?.selectedOptionId;

      if (questionId && optionId) {
        result[String(questionId)] =
          String(optionId);
      }
    }
  } else if (
    saved &&
    typeof saved === "object"
  ) {
    for (const [questionId, optionId] of Object.entries(
      saved
    )) {
      if (
        typeof optionId === "string" ||
        typeof optionId === "number"
      ) {
        result[String(questionId)] =
          String(optionId);
      }
    }
  }

  return result;
}

function resultIsFinal(attempt) {
  const status = String(
    attempt?.status || ""
  ).toUpperCase();

  return (
    [
      "SUBMITTED",
      "COMPLETED",
      "GRADED",
      "EVALUATED",
      "PASSED",
      "FAILED",
      "FINISHED",
    ].includes(status) ||
    Boolean(attempt?.submittedAt)
  );
}

function resultIsClosed(attempt) {
  return [
    "CANCELLED",
    "CANCELED",
    "EXPIRED",
    "VOID",
  ].includes(
    String(attempt?.status || "").toUpperCase()
  );
}

function quizAvailable(quiz) {
  if (
    !quiz ||
    quiz.canAttempt === false ||
    quiz.isAvailable === false ||
    quiz.isActive === false
  ) {
    return false;
  }

  if (
    quiz.attemptsRemaining != null &&
    Number(quiz.attemptsRemaining) <= 0
  ) {
    return false;
  }

  return ![
    "DRAFT",
    "INACTIVE",
    "ARCHIVED",
    "DELETED",
    "DISABLED",
    "SUSPENDED",
  ].includes(
    String(quiz.status || "").toUpperCase()
  );
}

function QuizMetadata({
  quiz,
  questionCount,
}) {
  const fields = [];

  if (
    questionCount != null &&
    Number.isFinite(Number(questionCount))
  ) {
    fields.push(
      `${Number(questionCount)} questions`
    );
  }

  if (quiz?.passingPercent != null) {
    fields.push(
      `${quiz.passingPercent}% passing score`
    );
  }

  if (quiz?.maxAttempts != null) {
    fields.push(
      `${quiz.maxAttempts} maximum attempts`
    );
  }

  return fields.length ? (
    <div className="quiz-meta mt-4">
      {fields.map((field) => (
        <span key={field}>{field}</span>
      ))}
    </div>
  ) : null;
}

function Alert({
  text,
  success = false,
}) {
  if (!text) return null;

  return (
    <p
      role={success ? "status" : "alert"}
      className={`rounded-lg px-4 py-3 text-sm leading-6 ${
        success
          ? "bg-[#edf5ee] text-[#315a48]"
          : "bg-[#fff3ef] text-[#9a493b]"
      }`}
    >
      {text}
    </p>
  );
}

function QuestionOptions({
  question,
  selected,
  onSelect,
  disabled,
}) {
  const options = optionsOf(question);
  const id = idOfQuestion(question);

  if (!id || !options.length) {
    return (
      <p className="mt-5 text-sm text-[#985142]">
        Options for this question are
        unavailable. Refresh or return to
        your quiz list.
      </p>
    );
  }

  return (
    <fieldset disabled={disabled} className="quiz-options mt-7">
      <legend className="sr-only">
        Select one answer
      </legend>

      {options.map((option, index) => {
        const optionId = idOfOption(option);

        if (!optionId) return null;

        const active =
          selected === String(optionId);

        return (
          <label
            key={String(optionId)}
            className={`quiz-option ${
              active
                ? "quiz-option-selected"
                : ""
            }`}
          >
            <input
              type="radio"
              name={`question-${String(id)}`}
              value={String(optionId)}
              checked={active}
              onChange={() =>
                onSelect(
                  String(id),
                  String(optionId)
                )
              }
              className="sr-only"
            />

            <span className="quiz-option-letter">
              {String.fromCharCode(65 + index)}
            </span>

            <span className="quiz-option-copy">
              {textOfOption(option) ||
                `Option ${index + 1}`}
            </span>

            <span className="quiz-option-check">
              {active ? <CheckIcon /> : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export default function MyQuizzes({
  quizId = "",
  attemptId = "",
}) {
  const router = useRouter();

  const detailMode = Boolean(
    quizId || attemptId
  );

  const lock = useRef(false);
  const loadVersion = useRef(0);

  const [page, setPage] = useState(1);
  const [attemptPage, setAttemptPage] =
    useState(1);

  const [pagination, setPagination] =
    useState(null);

  const [
    attemptPagination,
    setAttemptPagination,
  ] = useState(null);

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);

  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);

  const [
    confirmSubmit,
    setConfirmSubmit,
  ] = useState(false);

  const [
    submissionAccepted,
    setSubmissionAccepted,
  ] = useState(false);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState("");
  const [attemptError, setAttemptError] =
    useState("");

  const [notice, setNotice] = useState("");

  // Load quizzes, quiz details or attempt details.
  const load = useCallback(async () => {
    const version = ++loadVersion.current;

    setLoading(true);

    if (attemptId) {
      try {
        const result = await accountFetch(
          `me/quiz-attempts/${encodeURIComponent(
            attemptId
          )}`
        );

        const payload = dataOf(result);
        const current =
          payload?.attempt || payload;

        if (
          !current ||
          typeof current !== "object"
        ) {
          throw new Error(
            "Attempt details could not be loaded."
          );
        }

        let linkedQuiz = current.quiz || null;

        const linkedId =
          current.quizId ||
          current.quiz?.id;

        // Use attempt questions first; fetch linked
        // quiz only when questions are unavailable.
        if (
          linkedId &&
          !attemptedQuestions(
            current,
            linkedQuiz
          ).length
        ) {
          try {
            const details = await accountFetch(
              `me/quizzes/${encodeURIComponent(
                String(linkedId)
              )}`
            );

            const detailPayload = dataOf(
              details
            );

            linkedQuiz =
              detailPayload?.quiz ||
              detailPayload ||
              linkedQuiz;
          } catch {
            // Attempt status remains accessible.
          }
        }

        if (
          version !== loadVersion.current
        ) {
          return;
        }

        setAttempt(current);
        setQuiz(linkedQuiz);

        setAnswers((existing) => ({
          ...previousAnswers(current),
          ...existing,
        }));

        setError("");
      } catch (caught) {
        if (
          version === loadVersion.current
        ) {
          setError(
            caught?.message ||
              "Failed to load the attempt."
          );
        }
      }
    } else if (quizId) {
      try {
        const result = await accountFetch(
          `me/quizzes/${encodeURIComponent(
            quizId
          )}`
        );

        const payload = dataOf(result);

        if (
          version !== loadVersion.current
        ) {
          return;
        }

        setQuiz(
          payload?.quiz || payload || null
        );

        setError("");
      } catch (caught) {
        if (
          version === loadVersion.current
        ) {
          setError(
            caught?.message ||
              "Failed to load this quiz."
          );
        }
      }
    } else {
      const results = await Promise.allSettled([
        accountFetch(
          `me/quizzes?page=${page}&limit=20`
        ),
        accountFetch(
          `me/quiz-attempts?page=${attemptPage}&limit=20`
        ),
      ]);

      if (
        version !== loadVersion.current
      ) {
        return;
      }

      if (results[0].status === "fulfilled") {
        const result = results[0].value;
        const payload = dataOf(result);

        setQuizzes(
          listOf(payload, [
            "quizzes",
            "items",
          ])
        );

        setPagination(
          result.pagination ||
            payload?.pagination ||
            null
        );

        setError("");
      } else {
        setError(
          results[0].reason?.message ||
            "Failed to load quizzes."
        );

        setQuizzes([]);
      }

      if (results[1].status === "fulfilled") {
        const result = results[1].value;
        const payload = dataOf(result);

        setAttempts(
          listOf(payload, [
            "attempts",
            "items",
          ])
        );

        setAttemptPagination(
          result.pagination ||
            payload?.pagination ||
            null
        );

        setAttemptError("");
      } else {
        setAttemptError(
          results[1].reason?.message ||
            "Failed to load attempts."
        );

        setAttempts([]);
      }
    }

    if (
      version === loadVersion.current
    ) {
      setLoading(false);
    }
  }, [
    quizId,
    attemptId,
    page,
    attemptPage,
  ]);

  useEffect(() => {
    void load();

    return () => {
      loadVersion.current += 1;
    };
  }, [load]);

  useEffect(() => {
    setStep(0);
    setAnswers({});
    setConfirmSubmit(false);
    setSubmissionAccepted(false);
    setNotice("");
  }, [attemptId]);

  // Quiz progress.
  const questions = attemptedQuestions(
    attempt,
    quiz
  );

  const finalAttempt =
    resultIsFinal(attempt);

  const closedAttempt =
    resultIsClosed(attempt);

  const questionsValid =
    questions.length > 0 &&
    questions.every(
      (question) =>
        Boolean(
          idOfQuestion(question)
        ) &&
        optionsOf(question).some(
          (option) =>
            Boolean(idOfOption(option))
        )
    );

  const answered = questions.filter(
    (question) =>
      Boolean(
        answers[
          String(idOfQuestion(question))
        ]
      )
  ).length;

  const allAnswered =
    questionsValid &&
    answered === questions.length;

  const activeStep = Math.min(
    step,
    Math.max(
      questions.length - 1,
      0
    )
  );

  const activeQuestion =
    questions[activeStep];

  const progress = questions.length
    ? Math.round(
        (answered / questions.length) *
          100
      )
    : 0;

  // Start an attempt.
  async function start() {
    if (
      lock.current ||
      !quizId ||
      !quizAvailable(quiz)
    ) {
      return;
    }

    lock.current = true;
    setWorking(true);
    setError("");

    try {
      const result = await accountFetch(
        `me/quizzes/${encodeURIComponent(
          quizId
        )}/attempts`,
        {
          method: "POST",
          body: {},
        }
      );

      const payload = dataOf(result);

      const id =
        payload?.attempt?.id ||
        payload?.id ||
        payload?.attemptId;

      if (!id) {
        throw new Error(
          "The attempt request was processed, but no attempt ID was returned. Check your attempts before starting again."
        );
      }

      router.push(
        `/profile/quizzes/attempts/${encodeURIComponent(
          String(id)
        )}`
      );
    } catch (caught) {
      setError(
        caught?.message ||
          "Unable to start the quiz."
      );
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }

  // Validate answers before final confirmation.
  function reviewAnswers() {
    if (!questionsValid) {
      setError(
        "Some questions or options are missing. Refresh the attempt before submitting."
      );
      return;
    }

    const firstUnanswered =
      questions.findIndex(
        (question) =>
          !answers[
            String(
              idOfQuestion(question)
            )
          ]
      );

    if (firstUnanswered >= 0) {
      setStep(firstUnanswered);

      setError(
        `Answer all ${questions.length} questions before submitting.`
      );

      return;
    }

    setError("");
    void submit();
  }

  // Final quiz submission.
  async function submit() {
    if (
      lock.current ||
      !attemptId ||
      !allAnswered ||
      finalAttempt ||
      closedAttempt ||
      submissionAccepted
    ) {
      return;
    }

    lock.current = true;
    setWorking(true);
    setError("");
    setNotice("");

    try {
      const body = {
        answers: questions.map(
          (question) => ({
            questionId: String(
              idOfQuestion(question)
            ),

            optionId:
              answers[
                String(
                  idOfQuestion(question)
                )
              ],
          })
        ),
      };

      const result = await accountFetch(
        `me/quiz-attempts/${encodeURIComponent(
          attemptId
        )}/submit`,
        {
          method: "POST",
          body,
        }
      );

      setSubmissionAccepted(true);
      setConfirmSubmit(false);

      setNotice(
        result.message ||
          "Your quiz answers were submitted."
      );

      await load();
    } catch (caught) {
      setError(
        caught?.message ||
          "Unable to submit answers."
      );
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }

  const heading = attemptId
    ? titleOf(
        quiz,
        titleOf(
          attempt?.quiz,
          "Quiz attempt"
        )
      )
    : quizId
      ? titleOf(
          quiz,
          "Quiz details"
        )
      : "My quizzes";

  return (
    <main className="quiz-shell min-h-[65vh] bg-white px-4 py-8 text-[#29473c] sm:px-6 sm:py-10">
      <div className="quiz-container mx-auto max-w-5xl">

        {/* Header */}
        <header
          className={`quiz-header flex flex-wrap items-end justify-between gap-4 border-b ${sectionBorder} pb-6`}
        >
          <div className="quiz-heading">
            <Link
              href={
                detailMode
                  ? "/profile/quizzes"
                  : "/profile"
              }
              className="text-xs font-semibold text-[#53745c] hover:underline"
            >
              ←{" "}
              {detailMode
                ? "All quizzes"
                : "My account"}
            </Link>

            <h1 className="quiz-title mt-3 text-3xl font-semibold tracking-tight text-[#243b2d] sm:text-4xl">
              {heading}
            </h1>

            <p className="quiz-subtitle mt-2 text-sm leading-6 text-[#748276]">
              {attemptId
                ? "Answer the questions and submit when you are ready."
                : quizId
                  ? "Review the quiz details before starting."
                  : "Available quizzes and your previous attempts."}
            </p>
          </div>

          <button
            type="button"
            className={`${outline} quiz-refresh`}
            disabled={loading || working}
            onClick={load}
          >
            <RefreshIcon />
            <span>{loading
              ? "Refreshing…"
              : "Refresh"}</span>
          </button>
        </header>

        <div className="quiz-alert-stack mt-5 space-y-3">
          <Alert text={error} />
          <Alert
            text={notice}
            success
          />
        </div>

        {loading && (
          <p
            className="quiz-loading py-12 text-sm text-[#748276]"
            role="status"
          >
            Loading quizzes…
          </p>
        )}

        {/* Available quizzes and attempt history */}
        {!loading && !detailMode && (
          <div className="quiz-dashboard-grid mt-7 space-y-10">

            <section className="quiz-section quiz-section-available" aria-labelledby="available-quizzes-heading">
              <div className="quiz-section-heading flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="available-quizzes-heading"
                  className="text-xl font-semibold text-[#294132]"
                >
                  Available quizzes
                </h2>

                <Link
                  href="/profile/courses"
                  className="text-xs font-semibold text-[#315a48] hover:underline"
                >
                  My courses →
                </Link>
              </div>

              {!error &&
                (quizzes.length ? (
                  <div
                    className={`quiz-list mt-4 divide-y border-y ${sectionBorder}`}
                  >
                    {quizzes.map(
                      (item, index) => (
                        <div
                          key={
                            item.id ||
                            `quiz-${index}`
                          }
                          className="quiz-card flex flex-wrap items-center justify-between gap-4 py-5"
                        >
                          <div className="min-w-0 flex-1">
                            <h3 className="quiz-card-title text-[15px] font-semibold text-[#294331]">
                              {titleOf(
                                item,
                                "Quiz"
                              )}
                            </h3>

                            {item.description && (
                              <p className="quiz-card-description mt-1 line-clamp-2 text-sm leading-6 text-[#728276]">
                                {item.description}
                              </p>
                            )}

                            <QuizMetadata
                              quiz={item}
                              questionCount={
                                item.questionCount ??
                                item.questionsCount ??
                                (Array.isArray(
                                  item.questions
                                )
                                  ? item.questions
                                      .length
                                  : null)
                              }
                            />
                          </div>

                          {item.id && (
                            <Link
                              href={`/profile/quizzes/${encodeURIComponent(
                                String(item.id)
                              )}`}
                              className={`${outline} quiz-card-action`}
                            >
                              View quiz →
                            </Link>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#748276]">
                    No quizzes are available
                    right now.
                  </p>
                ))}

              <div className="mt-4">
                <Pagination
                  page={page}
                  pagination={pagination}
                  count={quizzes.length}
                  loading={loading}
                  onChange={setPage}
                />
              </div>
            </section>

            {/* Previous attempts */}
            <section className="quiz-section quiz-section-history" aria-labelledby="attempt-history-heading">
              <h2
                id="attempt-history-heading"
                className="text-xl font-semibold text-[#294132]"
              >
                Your quiz attempts
              </h2>

              <p className="mt-1 text-sm text-[#778679]">
                Continue an unfinished attempt
                or review a submitted result.
              </p>

              {attemptError && (
                <div className="mt-4">
                  <Alert text={attemptError} />

                  <button
                    type="button"
                    className="mt-2 text-sm font-semibold text-[#315a48] underline"
                    onClick={load}
                  >
                    Retry attempts
                  </button>
                </div>
              )}

              {!attemptError &&
                (attempts.length ? (
                    <div
                    className={`quiz-history-list mt-4 divide-y border-y ${sectionBorder}`}
                  >
                    {attempts.map(
                      (item, index) => (
                        <div
                          key={
                            item.id ||
                            `attempt-${index}`
                          }
                          className="quiz-history-item flex flex-wrap items-center justify-between gap-4 py-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#2b4635]">
                              {titleOf(
                                item.quiz ||
                                  item,
                                "Quiz attempt"
                              )}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2.5">
                              <Status
                                value={
                                  item.status
                                }
                              />

                              {item.percent !=
                                null && (
                                <span className="text-xs text-[#758478]">
                                  {item.percent}%
                                </span>
                              )}

                              {(item.submittedAt ||
                                item.createdAt) && (
                                <span className="text-xs text-[#758478]">
                                  {formatSchedule(
                                    item.submittedAt ||
                                      item.createdAt
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {item.id && (
                            <Link
                              href={`/profile/quizzes/attempts/${encodeURIComponent(
                                String(item.id)
                              )}`}
                              className="text-sm font-semibold text-[#315a48] hover:underline"
                            >
                              {resultIsFinal(
                                item
                              ) ||
                              resultIsClosed(
                                item
                              )
                                ? "View result"
                                : "Open attempt"}{" "}
                              →
                            </Link>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#748276]">
                    No quiz attempts yet.
                  </p>
                ))}

              <div className="mt-4">
                <Pagination
                  page={attemptPage}
                  pagination={
                    attemptPagination
                  }
                  count={attempts.length}
                  loading={loading}
                  onChange={
                    setAttemptPage
                  }
                />
              </div>
            </section>
          </div>
        )}

        {/* Individual quiz details */}
        {!loading &&
          quizId &&
          !attemptId &&
          (quiz ? (
            <section className="quiz-intro-card mt-7 max-w-3xl">
              <div className="quiz-intro-topline">
                <QuizMark />
                <span>QUIZ OVERVIEW</span>
              </div>

              <h2 className="quiz-intro-title text-lg font-semibold text-[#294331]">
                About this quiz
              </h2>

              {quiz.description ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#5c6e60]">
                  {quiz.description}
                </p>
              ) : (
                <p className="mt-3 text-sm text-[#718173]">
                  Review the available details
                  and begin when ready.
                </p>
              )}

              <QuizMetadata
                quiz={quiz}
                questionCount={
                  quiz.questionCount ??
                  quiz.questionsCount ??
                  (Array.isArray(
                    quiz.questions
                  )
                    ? quiz.questions.length
                    : null)
                }
              />

              <div className={`quiz-intro-action mt-6 border-t ${sectionBorder} pt-6`}>
                {quizAvailable(quiz) ? (
                  <button
                    type="button"
                    disabled={working}
                    className={primary}
                    onClick={start}
                  >
                    {working
                      ? "Starting..."
                      : "Start attempt"}
                  </button>
                ) : (
                  <p className="text-sm text-[#8a6355]">
                    This quiz is not currently
                    available for a new attempt.
                  </p>
                )}

                <p className="mt-3 text-xs leading-5 text-[#7b887c]">
                  Your attempt will be created
                  by the server when you start.
                </p>
              </div>
            </section>
          ) : (
            <p className="mt-7 text-sm text-[#748276]">
              Quiz details are unavailable.
            </p>
          ))}

        {/* Quiz attempt */}
        {!loading &&
          attemptId &&
          (attempt ? (
            <section className="quiz-attempt-shell mt-7 max-w-3xl">
              <div className="quiz-attempt-status flex flex-wrap items-center gap-3">
                <Status
                  value={attempt.status}
                />

                {attempt.attemptNumber !=
                  null && (
                  <span className="text-xs text-[#788579]">
                    Attempt{" "}
                    {attempt.attemptNumber}
                  </span>
                )}
              </div>

              {/* Submitted result */}
              {finalAttempt ||
              submissionAccepted ? (
                <div
                  className={`quiz-result-card mt-6 border-y ${sectionBorder} py-7`}
                >
                  <h2 className="text-xl font-semibold text-[#2b4835]">
                    {attempt.passed === true
                      ? "Quiz Passed"
                      : attempt.passed ===
                          false
                        ? "Quiz Not Passed"
                        : "Answers submitted"}
                  </h2>

                  <div className="quiz-result-stats mt-4 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#536657]">
                    {attempt.percent !=
                      null && (
                      <span>
                        Result:{" "}
                        <strong>
                          {attempt.percent}%
                        </strong>
                      </span>
                    )}

                    {attempt.score !=
                      null && (
                      <span>
                        Score:{" "}
                        <strong>
                          {attempt.score}
                          {attempt.totalPoints !=
                          null
                            ? ` / ${attempt.totalPoints}`
                            : ""}
                        </strong>
                      </span>
                    )}

                    {attempt.submittedAt && (
                      <span>
                        Submitted:{" "}
                        <strong>
                          {formatSchedule(
                            attempt.submittedAt
                          )}
                        </strong>
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#728174]">
                    {submissionAccepted &&
                    !finalAttempt
                      ? "Your submission was accepted. Refresh to check the latest result."
                      : "This attempt has been submitted. Your latest result is shown above when available."}
                  </p>

                  <Link
                    href="/profile/quizzes"
                    className={`${outline} mt-6`}
                  >
                    Back to quizzes →
                  </Link>
                </div>
              ) : closedAttempt ? (
                <div
                  className={`mt-6 border-t ${sectionBorder} pt-6`}
                >
                  <p className="text-sm text-[#7b5f56]">
                    This attempt is closed and
                    cannot be submitted.
                  </p>

                  <Link
                    href="/profile/quizzes"
                    className={`${outline} mt-5`}
                  >
                    Back to quizzes →
                  </Link>
                </div>
              ) : !questionsValid ? (
                <div
                  className={`mt-6 border-t ${sectionBorder} pt-6`}
                >
                  <p className="text-sm leading-6 text-[#8a6257]">
                    The question and option data
                    for this attempt is incomplete.
                    Refresh the attempt. If it
                    remains unavailable, return
                    to the quiz list.
                  </p>

                  <Link
                    href="/profile/quizzes"
                    className="mt-4 inline-flex text-sm font-semibold text-[#315a48] hover:underline"
                  >
                    Back to quizzes →
                  </Link>
                </div>
              ) : confirmSubmit ? (
                /* Review & confirmation */
                <div
                  className={`quiz-confirm-card mt-6 border-y ${sectionBorder} py-7`}
                >
                  <h2 className="text-xl font-semibold text-[#2b4733]">
                    Submit your answers?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#708073]">
                    You answered all{" "}
                    {questions.length} questions.
                    Submit only when you are
                    finished reviewing your
                    selections.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={working}
                      onClick={submit}
                      className={primary}
                    >
                      {working
                        ? "Submitting…"
                        : "Confirm submission"}
                    </button>

                    <button
                      type="button"
                      disabled={working}
                      onClick={() =>
                        setConfirmSubmit(
                          false
                        )
                      }
                      className={outline}
                    >
                      Review answers
                    </button>
                  </div>
                </div>
              ) : (
                /* One question at a time */
                <div className="quiz-question-stage mt-6">
                  <div className="quiz-progress-row flex items-center justify-between gap-3 text-xs font-semibold text-[#59705f]">
                    <span>
                      Question{" "}
                      {activeStep + 1} of{" "}
                      {questions.length}
                    </span>

                    <span>
                      {answered} answered ·{" "}
                      {progress}%
                    </span>
                  </div>

                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7eee8]"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      progress
                    }
                    aria-label="Quiz answers completed"
                  >
                    <div
                      className="h-full rounded-full bg-[#3f7652] transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <nav className="quiz-question-nav" aria-label="Quiz questions">
                    {questions.map((question, index) => {
                      const questionId = idOfQuestion(question);
                      const isAnswered = Boolean(
                        answers[String(questionId)]
                      );

                      return (
                        <button
                          key={String(questionId || index)}
                          type="button"
                          className={`quiz-question-number ${
                            index === activeStep
                              ? "quiz-question-number-active"
                              : ""
                          } ${
                            isAnswered
                              ? "quiz-question-number-answered"
                              : ""
                          }`}
                          aria-current={
                            index === activeStep
                              ? "step"
                              : undefined
                          }
                          aria-label={`Go to question ${index + 1}${
                            isAnswered ? ", answered" : ""
                          }`}
                          disabled={working}
                          onClick={() => setStep(index)}
                        >
                          {isAnswered ? (
                            <CheckIcon />
                          ) : (
                            index + 1
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  <div
                    className={`quiz-question-card mt-7 border-b ${sectionBorder} pb-7`}
                  >
                    <p className="quiz-question-kicker">
                      Question {activeStep + 1} of {questions.length}
                    </p>

                    <h2 className="quiz-question-title text-lg font-semibold leading-8 text-[#283f30]">
                      {textOfQuestion(
                        activeQuestion
                      )}
                    </h2>

                    <QuestionOptions
                      question={
                        activeQuestion
                      }
                      selected={
                        answers[
                          String(
                            idOfQuestion(
                              activeQuestion
                            )
                          )
                        ] || ""
                      }
                      onSelect={(
                        questionId,
                        optionId
                      ) => {
                        setAnswers(
                          (current) => ({
                            ...current,
                            [questionId]:
                              optionId,
                          })
                        );

                        setError("");
                      }}
                      disabled={working}
                    />
                  </div>

                  <div className="quiz-question-actions mt-5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      className={outline}
                      disabled={
                        activeStep === 0 ||
                        working
                      }
                      onClick={() =>
                        setStep(
                          (value) =>
                            Math.max(
                              0,
                              value - 1
                            )
                        )
                      }
                    >
                      ← Previous
                    </button>

                    {activeStep <
                    questions.length -
                      1 ? (
                      <button
                        type="button"
                        className={primary}
                        disabled={working}
                        onClick={() =>
                          setStep(
                            (value) =>
                              Math.min(
                                questions.length -
                                  1,
                                value + 1
                              )
                          )
                        }
                      >
                        Next question →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={primary}
                        disabled={working}
                        onClick={
                          reviewAnswers
                        }
                      >
                         Submit answers
                      </button>
                    )}
                  </div>

                  {activeStep ===
                    questions.length -
                      1 &&
                    !allAnswered && (
                      <p className="mt-3 text-xs leading-5 text-[#7a877c]">
                        All questions need an
                        answer before submission.
                      </p>
                    )}
                </div>
              )}
            </section>
          ) : (
            <p className="mt-7 text-sm text-[#748276]">
              Attempt details are unavailable.
            </p>
          ))}
      </div>
    </main>
  );
}
