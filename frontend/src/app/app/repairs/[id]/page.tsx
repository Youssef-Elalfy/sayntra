import { RecordDetail } from "@/features/operations/directory";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordDetail resource="repairs" id={id} />;
}
