import Invitation from "@/features/invitation";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <Invitation token={token} />;
}
