"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { api, post } from "@/lib/api";
import { Logo, Preferences, LivingNetwork } from "@/components/brand";
import { AmbientBackdrop } from "./ambient";
import { usePreferences } from "@/components/providers";
export default function Verification() {
  const { t } = usePreferences();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const user = useQuery({
    queryKey: ["user"],
    queryFn: () =>
      api<{ data: { email: string; email_verified_at: string | null } }>(
        "/auth/user",
      ),
    retry: false,
  });
  return (
    <main id="main" className="verify-page">
      <AmbientBackdrop />
      <LivingNetwork />
      <header>
        <Logo />
        <Preferences />
      </header>
      <section className="card stack">
        <MailCheck size={36} />
        <h2>{t("Check your inbox.", "راجع بريدك الإلكتروني.")}</h2>
        <p>
          {t(
            "Confirm your email to activate your workspace.",
            "أكّد بريدك الإلكتروني لتفعيل مساحة عملك.",
          )}
        </p>
        {user.data && <strong>{user.data.data.email}</strong>}
        {user.data?.data.email_verified_at ? (
          <Link className="button" href="/app">
            {t("Open workspace", "فتح مساحة العمل")}
          </Link>
        ) : (
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await post("/auth/email/verification-notification", {});
                setMessage(
                  t("Verification email requested.", "تم طلب رسالة التأكيد."),
                );
              } catch {
                setMessage(
                  t(
                    "Please sign in again or try later.",
                    "سجّل الدخول أو حاول لاحقًا.",
                  ),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("Resend verification email", "إعادة إرسال رسالة التأكيد")}
          </button>
        )}
        {message && <p role="status">{message}</p>}
        <Link href="/login" className="text-link">
          {t("Back to sign in", "الرجوع للدخول")}
        </Link>
      </section>
    </main>
  );
}
