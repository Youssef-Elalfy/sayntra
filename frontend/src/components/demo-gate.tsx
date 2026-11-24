"use client";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { DEMO_BUILD } from "@/lib/demo";
import { Logo, Preferences } from "./brand";
import { usePreferences } from "./providers";

/**
 * On the public portfolio build there is no backend: account pages explain
 * that and open the live demo instead of leading into a broken flow. Local and
 * production builds render the real authentication pages unchanged.
 */
export function DemoGate({ children }: { children: React.ReactNode }) {
  const { t } = usePreferences();
  if (!DEMO_BUILD) return <>{children}</>;
  return (
    <main id="main" className="demo-gate">
      <header>
        <Logo />
        <Preferences />
      </header>
      <section className="glass-panel demo-gate-card">
        <span className="demo-gate-icon" aria-hidden="true">
          <FlaskConical size={26} />
        </span>
        <h1>{t("This is a portfolio demo.", "هذا عرض تجريبي للأعمال.")}</h1>
        <p>
          {t(
            "Accounts, email verification and sign-in run on the full Laravel version of SAYNTRA. This public site skips them: open the dashboard instantly with fictional sample data.",
            "الحسابات وتأكيد البريد وتسجيل الدخول تعمل في نسخة SAYNTRA الكاملة على Laravel. هذا الموقع العام يتخطاها: افتح لوحة التحكم فورًا ببيانات مثال وهمية.",
          )}
        </p>
        <Link className="button" href="/demo">
          {t("Explore live demo", "جرّب العرض الحي")}
          <ArrowRight className="directional" size={17} />
        </Link>
        <Link className="text-link" href="/">
          {t("Back to home", "العودة للرئيسية")}
        </Link>
      </section>
    </main>
  );
}
