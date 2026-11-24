import { Suspense } from "react";
import { AuthPage } from "@/features/auth";
import { DemoGate } from "@/components/demo-gate";
export default function Page() {
  return (
    <DemoGate>
      <Suspense fallback={<div className="loading" />}>
        <AuthPage mode="reset-password" />
      </Suspense>
    </DemoGate>
  );
}
