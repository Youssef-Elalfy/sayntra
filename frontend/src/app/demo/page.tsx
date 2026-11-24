"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand";
import { usePreferences } from "@/components/providers";
import { startDemo } from "@/lib/demo";

/** Starts a browser-only demo session with sample data and opens the app. */
export default function DemoEntry() {
  const router = useRouter();
  const { t } = usePreferences();
  useEffect(() => {
    startDemo();
    router.replace("/app");
  }, [router]);
  return (
    <main id="main" className="workspace-loading">
      <Logo />
      <div className="loading" />
      <p role="status">
        {t("Preparing the live demo…", "جارٍ تجهيز العرض التجريبي…")}
      </p>
    </main>
  );
}
