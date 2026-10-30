
"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi, rowsOf } from "@/components/common/dashboard/data";
import { Pagination } from "@/components/common/dashboard/Elements";
import { formatSchedule } from "@/lib/student-flow";

const border = "border-[#e4ebe5]";

const action =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d3ded5] px-4 text-sm font-medium text-[#315a48] transition hover:bg-[#f5f8f5] disabled:cursor-not-allowed disabled:opacity-50";

function readable(value) {
  const raw = String(value || "")
    .replaceAll("_", " ")
    .toLowerCase();

  return raw
    ? raw.replace(/\b\w/g, (character) =>
        character.toUpperCase()
      )
    : "—";
}

function dateText(value) {
  return value ? formatSchedule(value) : "";
}

function bodyOf(value) {
  if (typeof value === "string") return value;

  if (!value || typeof value !== "object") {
    return "";
  }

  return (
    value.body ||
    value.text ||
    value.content ||
    ""
  );
}

function questionText(question) {
  return (
    bodyOf(question?.body) ||
    bodyOf(question?.question) ||
    question?.text ||
    question?.title ||
    ""
  );
}

function questionTitle(question) {
  return (
    question?.lessonTitle ||
    question?.lesson?.title ||
    question?.course?.title ||
    "Lesson question"
  );
}

function Status({ status }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const className = [
    "ANSWERED",
    "RESOLVED",
    "CLOSED",
  ].includes(normalized)
    ? "bg-[#e9f3ea] text-[#326442]"
    : [
        "PENDING",
        "OPEN",
        "UNANSWERED",
      ].includes(normalized)
      ? "bg-[#fff5df] text-[#8a6226]"
      : "bg-[#eef1ee] text-[#576b5d]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {readable(status)}
    </span>
  );
}

function PageHeader({
  questionId,
  reload,
  loading,
}) {
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-4 border-b ${border} pb-6`}
    >
      <div>
        <Link
          href={
            questionId
              ? "/profile/questions"
              : "/profile"
          }
          className="text-xs font-semibold text-[#53765c] hover:underline"
        >
          ← {questionId ? "All questions" : "My account"}
        </Link>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#243b2d] sm:text-4xl">
          {questionId
            ? "Question details"
            : "My questions"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#728174]">
          {questionId
            ? "Your question and its replies."
            : "Follow the questions you asked from course lessons."}
        </p>
      </div>

      <button
        type="button"
        className={action}
        onClick={reload}
        disabled={loading}
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

function QuestionDetail({ question }) {
  const replies = Array.isArray(question.replies)
    ? question.replies
    : [];

  const answer = bodyOf(question.answer);

  // Avoid displaying identical answer text twice.
  const visibleReplies = replies.filter((reply) => {
    const content = bodyOf(reply);

    return (
      !answer ||
      content.trim() !== answer.trim()
    );
  });

  const courseId =
    question.courseId ||
    question.course?.id;

  const lessonId =
    question.lessonId ||
    question.lesson?.id;

  return (
    <article className="mt-7">
      {/* Original question */}
      <div className={`border-b ${border} pb-6`}>
        <div className="flex flex-wrap items-center gap-3">
          <Status status={question.status} />

          {question.createdAt && (
            <span className="text-xs text-[#7a897c]">
              Asked {dateText(question.createdAt)}
            </span>
          )}
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-tight text-[#2b4634]">
          {questionTitle(question)}
        </h2>

        {question.course?.title &&
          question.course.title !==
            questionTitle(question) && (
            <p className="mt-1 text-sm text-[#718173]">
              {question.course.title}
            </p>
          )}

        <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-8 text-[#3e5043]">
          {questionText(question) ||
            "Question content is unavailable."}
        </p>

        {courseId && lessonId && (
          <Link
            href={`/profile/courses/${encodeURIComponent(
              String(courseId)
            )}/lessons/${encodeURIComponent(
              String(lessonId)
            )}`}
            className="mt-5 inline-flex text-sm font-semibold text-[#315a48] hover:underline"
          >
            Return to lesson →
          </Link>
        )}
      </div>

      {/* Facilitator replies */}
      <section
        className="pt-6"
        aria-labelledby="question-replies-heading"
      >
        <h3
          id="question-replies-heading"
          className="text-lg font-semibold text-[#263e2e]"
        >
          Replies
        </h3>

        {!answer && visibleReplies.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#748276]">
            No response yet. You can return here
            to check for a reply.
          </p>
        ) : (
          <div
            className={`mt-4 divide-y ${border}`}
          >
            {answer && (
              <div className="py-5 first:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#4c7758]">
                  Answer
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#46584a]">
                  {answer}
                </p>

                {question.answer?.createdAt && (
                  <p className="mt-2 text-xs text-[#819084]">
                    {dateText(
                      question.answer.createdAt
                    )}
                  </p>
                )}
              </div>
            )}

            {visibleReplies.map(
              (reply, index) => (
                <div
                  className="py-5 first:pt-0"
                  key={
                    reply.id ||
                    `reply-${index}`
                  }
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#4c7758]">
                      {reply.authorRole ===
                      "FACILITATOR"
                        ? "Facilitator reply"
                        : "Reply"}
                    </p>

                    {reply.createdAt && (
                      <span className="text-xs text-[#819084]">
                        {dateText(
                          reply.createdAt
                        )}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#46584a]">
                    {bodyOf(reply) ||
                      "Reply text unavailable."}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </article>
  );
}

export default function Questions({
  questionId = "",
}) {
  const [page, setPage] = useState(1);

  const detailMode = Boolean(questionId);

  const path = detailMode
    ? `me/questions/${encodeURIComponent(
        questionId
      )}`
    : `me/questions?page=${page}&limit=20`;

  const state = useApi(path);

  const question =
    state.data?.question ||
    (state.data?.id ? state.data : null);

  const items = detailMode
    ? []
    : rowsOf(state.data, [
        "questions",
        "items",
      ]);

  return (
    <main className="min-h-[65vh] bg-white px-4 py-8 text-[#29473c] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          questionId={questionId}
          reload={state.reload}
          loading={state.loading}
        />

        {state.loading && (
          <p
            className="py-12 text-sm text-[#708073]"
            role="status"
          >
            Loading questions…
          </p>
        )}

        {state.error && (
          <div
            className="mt-6 rounded-lg bg-[#fff3ef] p-4 text-sm text-[#9a493c]"
            role="alert"
          >
            {state.error}{" "}

            <button
              type="button"
              className="font-semibold underline"
              onClick={state.reload}
            >
              Try again
            </button>
          </div>
        )}

        {!state.loading &&
          !state.error &&
          (detailMode ? (
            question ? (
              <QuestionDetail question={question} />
            ) : (
              <p className="py-10 text-sm text-[#718073]">
                This question could not be found.
              </p>
            )
          ) : (
            <section
              className="mt-7"
              aria-label="My question list"
            >
              {items.length === 0 ? (
                <div className="py-8">
                  <h2 className="text-lg font-semibold text-[#2d4433]">
                    No questions yet
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#748276]">
                    Open an enrolled course lesson
                    to ask a question.
                  </p>

                  <Link
                    href="/profile/courses"
                    className="mt-4 inline-flex text-sm font-semibold text-[#315a48] hover:underline"
                  >
                    Go to my courses →
                  </Link>
                </div>
              ) : (
                <div
                  className={`divide-y border-y ${border}`}
                >
                  {items.map((item, index) => (
                    <div
                      key={
                        item.id ||
                        `question-${index}`
                      }
                      className="py-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-xs font-medium text-[#708372]">
                              {questionTitle(item)}
                            </span>

                            <Status
                              status={item.status}
                            />
                          </div>

                          <p className="mt-2 line-clamp-2 break-words text-sm font-medium leading-6 text-[#2c4535]">
                            {questionText(item) ||
                              "Question details"}
                          </p>

                          {item.createdAt && (
                            <p className="mt-2 text-xs text-[#829083]">
                              {dateText(
                                item.createdAt
                              )}
                            </p>
                          )}
                        </div>

                        {item.id && (
                          <Link
                            href={`/profile/questions/${encodeURIComponent(
                              String(item.id)
                            )}`}
                            className="shrink-0 text-sm font-semibold text-[#315a48] hover:underline"
                          >
                            View replies →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5">
                <Pagination
                  page={page}
                  pagination={state.pagination}
                  count={items.length}
                  loading={state.loading}
                  onChange={setPage}
                />
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}
