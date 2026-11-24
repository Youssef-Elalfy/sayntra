"use client";
import { useState } from "react";
import { patch, post } from "@/lib/api";
import { usePreferences } from "@/components/providers";
import { DEMO_BUILD, isDemoSession } from "@/lib/demo";
import { useWorkspace } from "@/components/workspace";
import { RecordForm } from "./shared";
import { PageHeading } from "@/components/ui";
import { Preferences } from "@/components/brand";
export default function Settings() {
  const demo = DEMO_BUILD || isDemoSession();
  const { t } = usePreferences();
  const { user, organization, permissions } = useWorkspace();
  const [notice, setNotice] = useState("");
  const saved = () => setNotice(t("Settings saved.", "تم حفظ الإعدادات."));
  return (
    <>
      <PageHeading
        title={t("Settings", "الإعدادات")}
        description={t(
          "Make this workspace your own.",
          "اضبط مساحة العمل بما يناسبك.",
        )}
      />
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      <div className="detail-grid">
        <section className="card stack">
          <h3>{t("Your profile", "ملفك الشخصي")}</h3>
          <RecordForm
            fields={[
              {
                name: "name",
                label: t("Full name", "الاسم الكامل"),
                required: true,
              },
            ]}
            initial={{ name: user.name }}
            submit={(v) => patch("/auth/profile", v)}
            onSaved={saved}
          />
          <h3>{t("Language & appearance", "اللغة والمظهر")}</h3>
          <Preferences />
          <h3>{t("Change password", "تغيير كلمة المرور")}</h3>
          {demo ? (
            <p className="demo-note">
              {t(
                "Password changes are part of the full Laravel version and are disabled in this portfolio demo.",
                "تغيير كلمة المرور جزء من نسخة Laravel الكاملة ومعطّل في هذا العرض التجريبي.",
              )}
            </p>
          ) : (
            <RecordForm
              fields={[
                {
                  name: "current_password",
                  label: t("Current password", "كلمة المرور الحالية"),
                  type: "password",
                  required: true,
                },
                {
                  name: "password",
                  label: t("New password", "كلمة المرور الجديدة"),
                  type: "password",
                  required: true,
                },
                {
                  name: "password_confirmation",
                  label: t("Confirm password", "تأكيد كلمة المرور"),
                  type: "password",
                  required: true,
                },
              ]}
              submit={(v) => post("/auth/password", v)}
              onSaved={saved}
            />
          )}
        </section>
        {permissions.includes("organization.manage") && (
          <section className="card stack">
            <h3>{t("Organization", "المؤسسة")}</h3>
            <RecordForm
              fields={[
                {
                  name: "name",
                  label: t("Business name", "اسم المركز"),
                  required: true,
                },
                {
                  name: "email",
                  label: t("Business email", "بريد المركز"),
                  type: "email",
                },
                { name: "phone", label: t("Phone", "الهاتف"), type: "tel" },
                {
                  name: "address",
                  label: t("Address", "العنوان"),
                  type: "textarea",
                },
                {
                  name: "timezone",
                  label: t("Time zone", "المنطقة الزمنية"),
                  required: true,
                },
              ]}
              initial={{
                name: organization.name,
                email: organization.email,
                phone: organization.phone,
                address: organization.address,
                timezone: organization.timezone,
              }}
              submit={(v) => patch("/organization", v)}
              onSaved={saved}
            />
          </section>
        )}
      </div>
    </>
  );
}
