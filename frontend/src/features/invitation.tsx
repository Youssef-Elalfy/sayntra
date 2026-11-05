"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, post } from "@/lib/api";
import { usePreferences } from "@/components/providers";
import { Logo, Preferences, LivingNetwork } from "@/components/brand";
import { AmbientBackdrop } from "./ambient";
import { RecordForm } from "./operations/shared";
export default function Invitation({ token }: { token: string }) {
  const { t } = usePreferences();
  const router = useRouter();
  const q = useQuery({
    queryKey: ["invitation", token],
    queryFn: () =>
      api<{
        data: {
          organization: string;
          email: string;
          existing_account: boolean;
        };
      }>(`/invitations/${token}`),
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
        {q.isLoading ? (
          <div className="loading" />
        ) : !q.data ? (
          <>
            <h2>{t("Invitation unavailable", "الدعوة غير متاحة")}</h2>
            <p>
              {t(
                "It may have expired or already been accepted. Ask your workspace owner for a fresh invitation.",
                "قد تكون الدعوة منتهية أو مستخدمة. اطلب دعوة جديدة من مالك المؤسسة.",
              )}
            </p>
          </>
        ) : (
          <>
            <h2>{t("Join your team", "انضم إلى فريقك")}</h2>
            <p>
              {q.data.data.organization} · {q.data.data.email}
            </p>
            {q.data.data.existing_account && (
              <p>
                {t(
                  "Sign in with this email, then return to accept this invitation.",
                  "سجّل الدخول بهذا البريد، ثم عد لقبول الدعوة.",
                )}{" "}
                <Link href="/login" className="text-link">
                  {t("Sign in", "دخول")}
                </Link>
              </p>
            )}
            <RecordForm
              fields={
                q.data.data.existing_account
                  ? []
                  : [
                      {
                        name: "name",
                        label: t("Full name", "الاسم الكامل"),
                        required: true,
                      },
                      {
                        name: "password",
                        label: t("Password", "كلمة المرور"),
                        type: "password",
                        required: true,
                      },
                      {
                        name: "password_confirmation",
                        label: t("Confirm password", "تأكيد كلمة المرور"),
                        type: "password",
                        required: true,
                      },
                    ]
              }
              submit={(v) => post(`/invitations/${token}/accept`, v)}
              onSaved={() => {
                router.replace("/app");
                router.refresh();
              }}
              label={t("Accept invitation", "قبول الدعوة")}
            />
          </>
        )}
      </section>
    </main>
  );
}
