import ClassSpace from "@/components/learning/ClassSpace";

export const metadata = { title: "My Class | Awaken With Me" };

export default async function MyClassPage({ params }) {
  const { classId } = await params;
  return <ClassSpace classId={classId} />;
}
