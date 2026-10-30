
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { accountFetch } from "@/lib/client-account";
import { addCourseToCart } from "@/lib/cart";

import {
  courseLearningHref,
  openEnrolledCourse,
} from "@/lib/course-learning";

export default function CourseEnrollmentAction({
  courseId,
  paid = false,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const locked = useRef(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);

  async function continueCourse() {
    if (locked.current || !courseId) return;

    locked.current = true;
    setBusy(true);
    setError("");
    setErrorStatus(null);

    try {
      let response;

      if (paid) {
        // Paid courses must go through the cart before learning access is
        // granted. Existing learners can still continue directly.
        try {
          response = await accountFetch(
            `me/courses/${encodeURIComponent(courseId)}`
          );
        } catch (e) {
          if (![403, 404].includes(e?.status)) throw e;
        }

        const existing = response?.data?.course
          ? {
              ...response.data.course,
              ...response.data,
            }
          : response?.data;

        if (
          existing &&
          existing.hasAccess !== false &&
          existing.enrollment?.hasAccess !== false
        ) {
          // Keep the successful access response for the normal redirect.
        } else {
          await addCourseToCart(courseId);
          router.push("/cart");
          return;
        }
      } else {
        response = await openEnrolledCourse(
          accountFetch,
          courseId
        );
      }

      const value = response?.data || {};

      const record = value.course
        ? {
            ...value.course,
            ...value,
          }
        : value;

      router.push(
        courseLearningHref({
          ...record,
          courseId,
        }) ||
          `/profile/courses/${encodeURIComponent(
            courseId
          )}`
      );
    } catch (e) {
      setError(
        e?.message || "Course access could not be verified."
      );

      setErrorStatus(e?.status ?? null);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={!courseId || busy}
        onClick={continueCourse}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#28533d] px-5 text-sm font-semibold text-white transition hover:bg-[#1d3e2e] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? "Checking course access…"
          : paid
          ? "Add to cart & pay"
          : "Enroll / start learning"}

        {!busy && (
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        )}
      </button>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-xl bg-[#fff4f0] px-4 py-3 text-sm leading-6 text-[#97513f]"
        >
          <p>{error}</p>

          {errorStatus === 401 && (
            <Link
              href={`/auth/login?next=${encodeURIComponent(
                pathname
              )}`}
              className="mt-1 inline-block font-semibold underline"
            >
              Sign in to continue
            </Link>
          )}

          {errorStatus === 403 && paid && (
            <p className="mt-1">
              Payment is required before course access is granted.
              Retry to add this course to your cart.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
