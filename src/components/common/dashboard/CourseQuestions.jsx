"use client";
import { RecordDetails } from "@/components/common/ApiRecordDisplay";
import { useState } from "react";
import { useApi, rowsOf, idOf } from "./data";
import { State, Card, Pagination } from "./Elements";
import MutationDialog from "./MutationDialog";
import { operationFor } from "@/lib/dashboard/operations";
export default function CourseQuestions({ courseId }) {
  const [page, setPage] = useState(1); const base = `facilitator/courses/${courseId}/questions`; const state = useApi(`${base}?page=${page}&limit=20`); const rows = rowsOf(state.data, ["questions"]); const [question, setQuestion] = useState(null); const [notice, setNotice] = useState("");
  return <Card title="Student questions">{notice && <p className="ws-notice" role="status">{notice}</p>}<State {...state} retry={state.reload} /><State empty={!state.loading && !state.error && !rows.length} title="No questions yet" description="Questions from your course lessons will appear here." /><ul className="ws-list">{rows.map(item => <li key={idOf(item)}><div className="ws-list-content"><h3>{item.user?.name || item.student?.name || "Course question"}</h3><RecordDetails record={item} /><p>{item.body || item.question}</p>{rowsOf(item, ["replies"]).map((reply, i) => <p key={idOf(reply) || i}>{reply.body}</p>)}</div><button className="ws-secondary" onClick={() => setQuestion(item)}>Reply</button></li>)}</ul><Pagination page={page} count={rows.length} pagination={state.pagination} loading={state.loading} onChange={setPage} />{question && <MutationDialog operation={operationFor("POST", "facilitator/courses/{{courseId}}/questions/{{questionId}}/replies")} path={`${base}/${idOf(question)}/replies`} detailPath={`${base}/${idOf(question)}`} title="Reply to student" current={question} onClose={() => setQuestion(null)} onSuccess={async () => { setNotice("Reply sent."); await state.reload(); }} />}</Card>;
}
