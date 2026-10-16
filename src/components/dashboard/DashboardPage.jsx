"use client";
import Overview from "./Overview";
import DigitalLibrary from "@/components/account/DigitalLibrary";
import UserResources, { LearningProgress } from "./UserResources";
import FacilitatorResources from "./FacilitatorResources";
import FacilitatorCategories from "./FacilitatorCategories";
import FacilitatorProfile from "./FacilitatorProfile";
import MediaLibrary from "./MediaLibrary";
import TeachingScope from "./TeachingScope";
import Analytics from "./Analytics";
import Earnings from "./Earnings";
import AccountSettings from "./AccountSettings";
import ApplicationWizard from "./ApplicationWizard";
import { State } from "./Elements";
import { useWorkspace } from "./WorkspaceShell";
import CourseSpace from "@/components/learning/CourseSpace";
import LessonSpace from "@/components/learning/LessonSpace";
import MyCourses from "@/components/learning/MyCourses";
import ClassSpace from "@/components/learning/ClassSpace";
import Questions from "@/components/learning/Questions";
import MyNotifications from "@/components/account/MyNotifications";
import MySessions from "@/components/sessions/MySessions";
import CommerceCenter from "@/components/commerce/CommerceCenter";
import MyQuizzes from "@/components/learning/MyQuizzes";
import MyMembership from "@/components/membership/MyMembership";
import MyMeditations from "@/components/learning/MyMeditations";
import Reviews from "@/components/learning/Reviews";
import AccountCenter from "@/components/account/AccountCenter";

export default function DashboardPage({ section = "overview", segments = [] }) {
  const { role } = useWorkspace(); const id = segments[0];
  if (section === "overview") return <Overview />;
  if (role === "facilitator" && section === "profile") return <FacilitatorProfile />;
  if (section === "profile" || section === "settings") return <AccountSettings settings={section === "settings"} />;
  if (role === "facilitator") {
    if (section === "media") return <MediaLibrary />;
    if (section === "categories") return <FacilitatorCategories key={id || "list"} id={id} />;
    if (["curriculum", "students", "registrations", "reviews"].includes(section)) return <TeachingScope key={section} section={section} />;
    if (section === "analytics") return <Analytics />;
    if (section === "earnings") return <Earnings key={id || "list"} id={id} />;
    return <FacilitatorResources key={`${section}-${id || "list"}`} section={section} id={id} />;
  }
  if (section === "digital-library") return <div className="ws-embedded"><DigitalLibrary key={id || "list"} entitlementId={id} embedded /></div>;
  if (section === "application") return <ApplicationWizard />;
  if (section === "progress") return <LearningProgress />;
  if (section === "wishlist") return <State empty title="Wishlist is not available yet" description="The account service does not currently provide a wishlist. You can explore the catalogue and add items to your cart." href="/dashboard/user/explore" action="Explore courses" />;
  if (section === "notifications") return <div className="ws-embedded"><MyNotifications /></div>;
  if (section === "community") return <div className="ws-embedded"><Questions key={id || "list"} questionId={id} /></div>;
  if (["orders", "payments", "refunds"].includes(section)) return <div className="ws-embedded"><CommerceCenter key={`${section}-${id || "list"}`} section={section} id={id} /></div>;
  if (["addresses", "badges"].includes(section)) return <div className="ws-embedded"><AccountCenter section={section} /></div>;
  if (section === "quizzes") return <div className="ws-embedded"><MyQuizzes key={segments.join("/")} quizId={id !== "attempts" ? id : undefined} attemptId={id === "attempts" ? segments[1] : undefined} /></div>;
  if (section === "membership") return <div className="ws-embedded"><MyMembership key={id || "list"} membershipId={id} /></div>;
  if (section === "meditations") return <div className="ws-embedded"><MyMeditations key={id || "list"} meditationId={id} /></div>;
  if (section === "reviews") return <div className="ws-embedded"><Reviews /></div>;
  if (section === "courses" && !id) return <MyCourses embedded />;
  if (id) return <div className="ws-embedded">{section === "courses" ? segments[1] === "lessons" && segments[2] ? <LessonSpace key={`${id}-${segments[2]}`} courseId={id} lessonId={segments[2]} /> : <CourseSpace key={id} courseId={id} /> : section === "workshops" ? <ClassSpace key={id} classId={id} /> : section === "bookings" ? <MySessions key={id} bookingId={id} /> : section === "orders" ? <CommerceCenter section="orders" id={id} /> : <CertificateDetail id={id} />}</div>;
  return <UserResources key={section} section={section} />;
}

import { useApi, date } from "./data";
import { Card, Badge } from "./Elements";
function CertificateDetail({ id }) { const state = useApi(`me/certificates/${id}`); const data = state.data?.certificate || state.data; return <><State {...state} retry={state.reload} />{data && <Card title={data.title || data.courseTitle || "Your certificate"}><Badge status={data.status} /><p className="ws-muted">Issued {date(data.issuedAt)}</p><p>{data.verificationCode || data.code}</p><a href={`/api/account/me/certificates/${id}/download`} className="ws-button">Download certificate</a></Card>}</>; }
