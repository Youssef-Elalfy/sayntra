import { Suspense } from "react";
import { AuthPage } from "@/features/auth";
export default function Page() {
  return (
    <Suspense fallback={<div className="loading" />}>
      <AuthPage mode="forgot-password" />
    </Suspense>
  );
}
