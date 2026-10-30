"use client";

import Link from "next/link";
import { BookOpen, Check, ChevronRight, FileText, Headphones, LockKeyhole, Play, ChevronDown } from "lucide-react";
import { courseSections, titleOf } from "@/lib/learning-data";
import { completedLesson, courseProgress, lessonLocked } from "@/lib/course-learning";
import "./learning.css";

export function LearningBreadcrumb({ base, courseHref, courseTitle, lessonTitle }) {
  return <nav className="learn-breadcrumb" aria-label="Learning breadcrumb">
    <Link href={base}>My courses</Link>
    {courseTitle && <><ChevronRight size={13} />{courseHref ? <Link href={courseHref}>{courseTitle}</Link> : <span aria-current="page">{courseTitle}</span>}</>}
    {lessonTitle && <><ChevronRight size={13} /><span aria-current="page">{lessonTitle}</span></>}
  </nav>;
}

export function LearningProgress({ record, label = "Course progress" }) {
  const values = courseProgress(record);
  const hasPercent = values.percent !== null;
  return <div className="learn-progress">
    <div><span>{label}</span>{hasPercent && <strong>{Math.round(values.percent)}%</strong>}</div>
    {hasPercent && <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={values.percent} className="learn-progress-track"><span style={{ width: `${values.percent}%` }} /></div>}
    {values.completed != null && values.total != null && <p>{values.completed} of {values.total} lessons completed</p>}
    {!hasPercent && values.completed == null && <p>Progress appears as you complete your lessons.</p>}
  </div>;
}

export function LessonIcon({ kind, size = 16 }) {
  const Icon = kind === "VIDEO" ? Play : kind === "AUDIO" ? Headphones : kind === "DOCUMENT" ? FileText : BookOpen;
  return <Icon size={size} aria-hidden="true" />;
}

export function Curriculum({ course, progress, courseHref, activeLessonId, canAccess = true, compact = false }) {
  const groups = courseSections(course);
  return <div className={`learn-curriculum ${compact ? "is-compact" : ""}`}>
    {groups.length ? groups.map((group, groupIndex) => <details key={group.id} className="learn-module" open>
      <summary><span><small>MODULE {String(groupIndex + 1).padStart(2, "0")}</small><strong>{group.title}</strong><em>{group.lessons.length} {group.lessons.length === 1 ? "lesson" : "lessons"}</em></span><ChevronDown size={16} /></summary>
      <ol>{group.lessons.map((lesson, lessonIndex) => {
        const index = groups.slice(0, groupIndex).reduce((total, section) => total + section.lessons.length, 0) + lessonIndex + 1;
        const id = lesson.id || lesson.lessonId;
        const complete = completedLesson(progress, id) || lesson.completed === true || lesson.progress?.status === "COMPLETED";
        const locked = !canAccess || lessonLocked(lesson) || !id;
        const active = String(id) === String(activeLessonId);
        const content = <><span className={`learn-lesson-state ${complete ? "is-complete" : ""}`}>{locked ? <LockKeyhole size={14} /> : complete ? <Check size={15} /> : String(index).padStart(2, "0")}</span><span className="learn-lesson-copy"><strong>{titleOf(lesson, `Lesson ${index}`)}</strong><small><LessonIcon kind={lesson.contentType} size={12} />{lesson.contentType ? String(lesson.contentType).toLowerCase() : "Lesson"}{Number(lesson.durationMinutes ?? lesson.duration) > 0 && ` · ${lesson.durationMinutes ?? lesson.duration} min`}{complete && " · Completed"}{locked && " · Locked"}</small></span>{active ? <span className="learn-now">Now</span> : !compact && <span className="learn-lesson-action">{locked ? "Locked" : complete ? "Review" : "Open"}<ChevronRight size={14} /></span>}</>;
        return <li key={id || index} className={active ? "is-active" : ""}>{locked ? <div className="learn-lesson-row is-locked">{content}</div> : <Link className="learn-lesson-row" href={`${courseHref}/lessons/${encodeURIComponent(id)}`} aria-current={active ? "page" : undefined}>{content}</Link>}</li>;
      })}</ol>
    </details>) : <div className="learn-empty"><BookOpen size={28} /><h3>Lessons are on their way</h3><p>Your published lessons will appear here when they are available.</p></div>}
  </div>;
}

export function LearningSkeleton({ lesson = false }) {
  return <div className="learn-skeleton" role="status"><span className="sr-only">{lesson ? "Loading lesson" : "Loading your courses"}</span><div /><div /><div /></div>;
}
