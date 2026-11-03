"use client";
import dynamic from "next/dynamic";

function PageLoading() { return <div className="ws-skeleton" role="status" aria-label="Loading page" />; }
import Overview from "./Overview";
const DigitalLibrary = dynamic(() => import("@/components/user/profile/DigitalLibrary"), { loading: PageLoading });
import UserResources, { LearningProgress } from "./UserResources";
const FacilitatorResources = dynamic(() => import("./FacilitatorResources"), { loading: PageLoading });
const FacilitatorCategories = dynamic(() => import("./FacilitatorCategories"), { loading: PageLoading });
const FacilitatorProfile = dynamic(() => import("./FacilitatorProfile"), { loading: PageLoading });
const MediaLibrary = dynamic(() => import("./MediaLibrary"), { loading: PageLoading });
const TeachingScope = dynamic(() => import("./TeachingScope"), { loading: PageLoading });
const Analytics = dynamic(() => import("./Analytics"), { loading: PageLoading });
const Earnings = dynamic(() => import("./Earnings"), { loading: PageLoading });
const PayoutRequests = dynamic(() => import("./PayoutRequests"), { loading: PageLoading });
const AccountSettings = dynamic(() => import("./AccountSettings"), { loading: PageLoading });
const ApplicationWizard = dynamic(() => import("./ApplicationWizard"), { loading: PageLoading });
import { State } from "./Elements";
import { useWorkspace } from "./WorkspaceShell";
const CourseSpace = dynamic(() => import("@/components/user/learning/CourseSpace"), { loading: PageLoading });
const LessonSpace = dynamic(() => import("@/components/user/learning/LessonSpace"), { loading: PageLoading });
const MyCourses = dynamic(() => import("@/components/user/learning/MyCourses"), { loading: PageLoading });
const ClassSpace = dynamic(() => import("@/components/user/learning/ClassSpace"), { loading: PageLoading });
const Questions = dynamic(() => import("@/components/user/learning/Questions"), { loading: PageLoading });
const MyNotifications = dynamic(() => import("@/components/user/profile/MyNotifications"), { loading: PageLoading });
const MySessions = dynamic(() => import("@/components/user/sessions/MySessions"), { loading: PageLoading });
const CommerceCenter = dynamic(() => import("@/components/user/commerce/CommerceCenter"), { loading: PageLoading });
const MyQuizzes = dynamic(() => import("@/components/user/learning/MyQuizzes"), { loading: PageLoading });
const MyMembership = dynamic(() => import("@/components/user/membership/MyMembership"), { loading: PageLoading });
const MyMeditations = dynamic(() => import("@/components/user/learning/MyMeditations"), { loading: PageLoading });
const Reviews = dynamic(() => import("@/components/user/learning/Reviews"), { loading: PageLoading });
const AddressBook = dynamic(() => import("@/components/user/profile/AddressBook"), { loading: PageLoading });
const BadgesPanel = dynamic(() => import("@/components/user/profile/BadgesPanel"), { loading: PageLoading });
const CourseList = dynamic(() => import("./courses/CourseWorkspace").then((module) => module.CourseList), { loading: PageLoading });
const CoursePage = dynamic(() => import("./courses/CourseWorkspace").then((module) => module.CoursePage), { loading: PageLoading });

export default function DashboardPage({ section = "overview", segments = [] }) {
  const { role } = useWorkspace(); const id = segments[0];
  if (section === "overview") return <Overview />;
  if (role === "facilitator" && section === "profile") return <FacilitatorProfile />;
  if (section === "profile" || section === "settings") return <AccountSettings settings={section === "settings"} />;
  if (role === "facilitator") {
    if (section === "courses") return id ? <CoursePage key={id} courseId={id} /> : <CourseList />;
    if (section === "media") return <MediaLibrary />;
    if (section === "categories") return <FacilitatorCategories key={id || "list"} id={id} />;
    if (["curriculum", "students", "registrations", "reviews"].includes(section)) return <TeachingScope key={section} section={section} />;
    if (section === "analytics") return <Analytics />;
    if (section === "earnings") return <Earnings key={id || "list"} id={id} />;
    if (section === "payouts") return <PayoutRequests key={id || "list"} id={id} />;
    return <FacilitatorResources key={`${section}-${id || "list"}`} section={section} id={id} />;
  }
  if (section === "digital-library") return <div className="ws-embedded"><DigitalLibrary key={id || "list"} entitlementId={id} embedded /></div>;
  if (section === "application") return <ApplicationWizard />;
  if (section === "progress") return <LearningProgress />;
  if (section === "notifications") return <div className="ws-embedded"><MyNotifications /></div>;
  if (section === "community") return <div className="ws-embedded"><Questions key={id || "list"} questionId={id} /></div>;
  if (["orders", "payments", "refunds"].includes(section)) return <div className="ws-embedded"><CommerceCenter key={`${section}-${id || "list"}`} section={section} id={id} embedded /></div>;
  if (section === "addresses") return <div className="ws-embedded"><AddressBook /></div>;
  if (section === "badges") return <BadgesPanel />;
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
