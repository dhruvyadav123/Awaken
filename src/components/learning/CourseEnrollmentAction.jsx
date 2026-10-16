"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { accountFetch } from "@/lib/client-account";
import { courseLearningHref, openEnrolledCourse } from "@/lib/course-learning";

export default function CourseEnrollmentAction({ courseId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signIn, setSignIn] = useState(false);
  const lock = useRef(false);

  async function openCourse() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setSignIn(false);
    try {
      const result = await openEnrolledCourse(accountFetch, courseId);
      const record = result.data?.course ? { ...result.data.course, ...result.data } : result.data;
      router.push(courseLearningHref({ ...record, courseId }) || `/profile/courses/${encodeURIComponent(courseId)}`);
    } catch (caught) { setError(caught.message); setSignIn(caught.status === 401); }
    finally { lock.current = false; setBusy(false); }
  }

  return <div><button type="button" disabled={busy} onClick={openCourse} className="inline-flex min-h-12 items-center bg-[#315a48] px-6 text-sm font-semibold text-white hover:bg-[#254638] disabled:opacity-50">{busy ? "Opening your course..." : "Enroll or continue learning"}</button>
    {error && <p role="alert" className="mt-3 max-w-xl text-sm text-[#8a4c3c]">{error}{signIn && <Link href={`/auth/login?next=${encodeURIComponent(`/profile/courses/${courseId}`)}`} className="ml-2 underline">Sign in to continue</Link>}</p>}
  </div>;
}
