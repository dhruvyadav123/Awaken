import ClassSpace from "@/components/user/learning/ClassSpace";

export const metadata = { title: "My Class | AwakenWithMeheck" };

export default async function MyClassPage({ params }) {
  const { classId } = await params;
  return <ClassSpace classId={classId} />;
}
