import Invitation from "@/features/invitation";
import { DemoGate } from "@/components/demo-gate";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <DemoGate>
      <Invitation token={token} />
    </DemoGate>
  );
}
