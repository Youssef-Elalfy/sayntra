"use client";
import { Logo, Preferences } from "@/components/brand";
import { usePreferences } from "@/components/providers";
export default function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const { t } = usePreferences();
  return (
    <main id="main" className="legal-page">
      <div className="row between">
        <Logo />
        <Preferences />
      </div>
      <h1>
        {kind === "privacy"
          ? t("Privacy notice", "إشعار الخصوصية")
          : t("Terms of use", "شروط الاستخدام")}
      </h1>
      <p>
        {t(
          "Development release — the operating business must finalize its contact details, policies and jurisdiction before a commercial launch.",
          "إصدار قيد التطوير — يجب على الجهة المشغلة استكمال بيانات التواصل والسياسات والاختصاص القانوني قبل الإطلاق التجاري.",
        )}
      </p>
      {kind === "privacy" ? (
        <>
          <h2>{t("What is recorded", "البيانات المسجلة")}</h2>
          <p>
            {t(
              "SAYNTRA stores account details, organization memberships, customer contact information, devices, repair history and authorized business transactions. Session cookies protect sign-in; preference cookies remember language and theme.",
              "تخزّن صاينترا بيانات الحساب والعضوية وبيانات تواصل العملاء والأجهزة وسجل الصيانة والعمليات المصرح بها. تُستخدم ملفات تعريف الارتباط للجلسة الآمنة وتفضيلات اللغة والمظهر.",
            )}
          </p>
          <h2>{t("Access and retention", "الوصول والاحتفاظ")}</h2>
          <p>
            {t(
              "Access is restricted by organization membership and role. Repair centers are responsible for collecting only necessary customer data and establishing retention, backup and deletion policies appropriate to their obligations. Contact the repair center to request corrections to its records.",
              "الوصول مقيد بعضوية المؤسسة والدور. مركز الصيانة مسؤول عن جمع البيانات اللازمة فقط وتحديد سياسات الاحتفاظ والنسخ الاحتياطي والحذف بما يناسب التزاماته. تواصل مع مركز الصيانة لطلب تصحيح سجلاتك.",
            )}
          </p>
        </>
      ) : (
        <>
          <h2>{t("Intended use", "الاستخدام المقصود")}</h2>
          <p>
            {t(
              "Use your workspace only for authorized repair-business operations. You are responsible for the accuracy of entered records, staff access and any service commitments made to customers.",
              "استخدم مساحة عملك لعمليات الصيانة المصرح بها فقط. أنت مسؤول عن دقة البيانات وصلاحيات الفريق والالتزامات المقدمة للعملاء.",
            )}
          </p>
          <h2>{t("Payments and availability", "المدفوعات والتوافر")}</h2>
          <p>
            {t(
              "Recorded payments are bookkeeping entries; SAYNTRA does not transfer funds in this release. No subscription fee or uptime guarantee is established by this development release. Warranty coverage is set by the repair business for each eligible repair.",
              "المدفوعات المسجلة هي قيود حسابية؛ صاينترا لا تحوّل أموالًا في هذا الإصدار. لا يحدد إصدار التطوير رسوم اشتراك أو ضمان توافر. يحدد مركز الصيانة تغطية الضمان لكل طلب مؤهل.",
            )}
          </p>
        </>
      )}
      <p>{t("Last updated: 25 October 2026.", "آخر تحديث: 25 أكتوبر 2026.")}</p>
    </main>
  );
}
