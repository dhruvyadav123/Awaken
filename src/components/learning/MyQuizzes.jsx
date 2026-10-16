"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { accountFetch } from "@/lib/client-account";
import { dataOf, listOf, titleOf } from "@/lib/learning-data";

import { Pagination } from "@/components/dashboard/Elements";
function questionsOf(value) { return listOf(value, ["questions", "items"]); }
function optionsOf(value) { return listOf(value, ["options", "choices"]); }

export default function MyQuizzes({ quizId, attemptId }) {
  const router = useRouter();
  const lock = useRef(false);
  const [page, setPage] = useState(1), [attemptPage, setAttemptPage] = useState(1);
  const [pagination, setPagination] = useState(null), [attemptPagination, setAttemptPagination] = useState(null), [attemptError, setAttemptError] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    if (attemptId) {
      try {
        const result = await accountFetch(`me/quiz-attempts/${encodeURIComponent(attemptId)}`);
        const value = dataOf(result);
        const current = value?.attempt || value;
        setAttempt(current);
        const linkedQuiz = current?.quizId || current?.quiz?.id;
        if (current?.quiz) setQuiz(current.quiz);
        else if (linkedQuiz) { const details = await accountFetch(`me/quizzes/${encodeURIComponent(linkedQuiz)}`); const detailValue = dataOf(details); setQuiz(detailValue?.quiz || detailValue); }
        setError("");
      } catch (caught) { setError(caught.message); }
    } else if (quizId) {
      try { const result = await accountFetch(`me/quizzes/${encodeURIComponent(quizId)}`); const value = dataOf(result); setQuiz(value?.quiz || value); setError(""); }
      catch (caught) { setError(caught.message); }
    } else {
      const [quizResult, attemptResult] = await Promise.allSettled([accountFetch(`me/quizzes?page=${page}&limit=20`), accountFetch(`me/quiz-attempts?page=${attemptPage}&limit=20`)]);
      if (quizResult.status === "fulfilled") { setQuizzes(listOf(dataOf(quizResult.value), ["quizzes", "items"])); setPagination(quizResult.value.pagination); setError(""); }
      else setError(quizResult.reason.message);
      if (attemptResult.status === "fulfilled") { setAttempts(listOf(dataOf(attemptResult.value), ["attempts", "items"])); setAttemptPagination(attemptResult.value.pagination); setAttemptError(""); } else setAttemptError(attemptResult.reason.message);
    }
    setLoading(false);
  }, [quizId, attemptId, page, attemptPage]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function start() {
    if (lock.current) return; lock.current = true;
    setWorking(true); setError("");
    try {
      const result = await accountFetch(`me/quizzes/${encodeURIComponent(quizId)}/attempts`, { method: "POST", body: {} });
      const value = dataOf(result);
      const id = value?.attempt?.id || value?.id || value?.attemptId;
      if (!id) throw new Error("Attempt created, but its ID was not returned. Check My Quizzes before trying again.");
      router.push(`/profile/quizzes/attempts/${encodeURIComponent(id)}`);
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(false); }
  }

  async function submit(event) {
    event.preventDefault();
    const questions = questionsOf(quiz || attempt);
    if (lock.current || !questions.length || questions.some((item) => !answers[item.id || item.questionId])) return;
    lock.current = true; setWorking(true); setError(""); setNotice("");
    try {
      const result = await accountFetch(`me/quiz-attempts/${encodeURIComponent(attemptId)}/submit`, { method: "POST", body: { answers: questions.map((item) => ({ questionId: item.id || item.questionId, optionId: answers[item.id || item.questionId] })) } });
      setNotice(result.message || "Quiz submitted."); await load();
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setWorking(false); }
  }

  const questions = questionsOf(quiz || attempt);
  const submitted = ["SUBMITTED", "COMPLETED", "GRADED"].includes(String(attempt?.status || "").toUpperCase());
  return <main className="min-h-[65vh] bg-[#f7f8f3] px-5 py-12 text-[#29473c]"><div className="mx-auto max-w-4xl"><Link href="/profile/quizzes" className="text-sm font-semibold text-[#315a48] underline">← My quizzes</Link><h1 className="mt-8 font-[Georgia,serif] text-4xl">{attemptId ? titleOf(quiz, "Quiz attempt") : quizId ? titleOf(quiz, "Quiz") : "My quizzes"}</h1>
    {loading && <p className="mt-6" role="status">Loading quizzes…</p>}{error && <p className="mt-6 rounded-lg bg-[#fff4f0] p-4 text-sm text-[#8a4c3c]" role="alert">{error}</p>}{notice && <p className="mt-6 rounded-lg bg-[#edf5ed] p-4 text-sm" role="status">{notice}</p>}
    {!loading && !quizId && !attemptId && <><section className="mt-8"><h2 className="font-[Georgia,serif] text-2xl">Available quizzes</h2>{quizzes.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{quizzes.map((item) => <Link key={item.id} href={`/profile/quizzes/${encodeURIComponent(item.id)}`} className="rounded-xl border border-[#dfe7dd] bg-white p-5 font-semibold text-[#315a48]">{titleOf(item, "Quiz")} →</Link>)}</div> : <p className="mt-3 text-sm">No quizzes available.</p>}<Pagination page={page} pagination={pagination} count={quizzes.length} loading={loading} onChange={setPage} /></section><section className="mt-8"><h2 className="font-[Georgia,serif] text-2xl">Attempts</h2>{attemptError && <p role="alert" className="mt-3">{attemptError} <button className="underline" onClick={load}>Retry attempts</button></p>}{attempts.length ? <div className="mt-4 grid gap-3">{attempts.map((item) => <Link key={item.id} href={`/profile/quizzes/attempts/${encodeURIComponent(item.id)}`} className="rounded-xl border border-[#dfe7dd] bg-white p-5 text-sm text-[#315a48]">{titleOf(item.quiz || item, "Quiz attempt")} · {item.status || "In progress"} →</Link>)}</div> : <p className="mt-3 text-sm">{attemptError ? "Attempts could not be loaded." : "No attempts yet."}</p>}<Pagination page={attemptPage} pagination={attemptPagination} count={attempts.length} loading={loading} onChange={setAttemptPage} /></section></>}
    {!loading && quizId && quiz && <div className="mt-8 rounded-xl border border-[#dfe7dd] bg-white p-6"><p className="text-sm leading-7 text-[#647368]">{quiz.description || "Start when you are ready."}</p><p className="mt-3 text-sm">{questions.length} questions ? Passing score: {quiz.passingPercent}% ? Maximum attempts: {quiz.maxAttempts}</p><button type="button" disabled={working} onClick={start} className="mt-5 rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Starting…" : "Start attempt"}</button></div>}
    {!loading && attemptId && attempt && <><p className="mt-4 text-sm text-[#647368]">Status: {attempt.status || "In progress"}{attempt.score != null ? ` · Score: ${attempt.score}` : ""}</p>{submitted && <p role="status" className="mt-4 rounded-lg bg-white p-5">{attempt.passed === true ? "Passed" : attempt.passed === false ? "Not passed" : "Submitted"}{attempt.percent != null && ` ? ${attempt.percent}%`}{attempt.totalPoints != null && ` ? ${attempt.score} / ${attempt.totalPoints} points`}</p>}{!submitted && questions.length > 0 && <form onSubmit={submit} className="mt-6 grid gap-5">{questions.map((question, index) => { const id = question.id || question.questionId; return <fieldset key={id} className="rounded-xl border border-[#dfe7dd] bg-white p-6"><legend className="font-semibold">{index + 1}. {question.prompt || question.body || question.text || question.title || "Question"}</legend><div className="mt-4 grid gap-2">{optionsOf(question).map((option) => { const optionId = option.id || option.optionId; return <label key={optionId} className="flex items-start gap-3 text-sm"><input type="radio" name={String(id)} value={optionId} checked={answers[id] === optionId} onChange={() => setAnswers((current) => ({ ...current, [id]: optionId }))} /><span>{option.text || option.body || option.label || "Option"}</span></label>; })}</div></fieldset>; })}<button disabled={working || questions.some((item) => !answers[item.id || item.questionId])} className="w-fit rounded-md bg-[#315a48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working ? "Submitting…" : "Submit answers"}</button></form>}{!submitted && !questions.length && <p className="mt-6 rounded-xl bg-white p-6 text-sm">Question details are not available for this attempt.</p>}</>}
  </div></main>;
}
