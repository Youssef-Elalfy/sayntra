"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Clock3, Users, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePreferences } from "@/components/providers";
import { useWorkspace } from "@/components/workspace";
import { PageHeading, ErrorState, EmptyState } from "@/components/ui";
import { RecordData, Status } from "./shared";
import { CountUp } from "@/components/tilt";
import { formatDate, formatRelative } from "@/lib/format";

const activityLabels: Record<string, readonly [string, string]> = {
  "customer.created": ["Customer added", "إضافة عميل"],
  "customer.updated": ["Customer updated", "تعديل عميل"],
  "device.created": ["Device registered", "تسجيل جهاز"],
  "device.updated": ["Device updated", "تعديل جهاز"],
  "repair.created": ["Repair received", "إنشاء طلب صيانة"],
  "repair.assigned": ["Technician assigned", "إسناد طلب لفني"],
  "repair.diagnosed": ["Diagnosis recorded", "تسجيل فحص"],
  "repair.status_changed": ["Repair status changed", "تحديث حالة الطلب"],
};
type Dashboard = {
  metrics: Record<string, number>;
  recent_repairs: RecordData[];
  status_counts: { status: string; count: number }[];
  volume: { date: string; count: number }[];
  activity: { id: number; event: string; created_at: string }[];
};
export default function Dashboard() {
  const { t, language } = usePreferences();
  const { user, permissions } = useWorkspace();
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<{ data: Dashboard }>("/dashboard"),
    refetchInterval: 30000,
  });
  const labels: Record<string, [string, string, typeof Wrench]> = {
    total_repairs: ["Total repairs", "إجمالي الطلبات", Wrench],
    active_repairs: ["Active repairs", "إصلاحات جارية", Clock3],
    awaiting_approval: ["Awaiting approval", "بانتظار الموافقة", Clock3],
    ready_for_pickup: ["Ready for pickup", "جاهز للاستلام", CheckCircle2],
    customers: ["Customers", "العملاء", Users],
  };
  return (
    <>
      <PageHeading
        eyebrow={t("YOUR BUSINESS, IN FOCUS", "صورة أوضح لأعمالك")}
        title={t(
          `Welcome back, ${user.name.split(" ")[0]}.`,
          `أهلًا ${user.name.split(" ")[0]}، نورت.`,
        )}
        description={t(
          "A little clarity. A productive day ahead.",
          "تفاصيل أوضح، ويوم أكثر إنتاجية.",
        )}
        action={
          permissions.includes("repairs.write") && (
            <Link href="/app/repairs" className="button">
              {t("Manage repairs", "إدارة الطلبات")} ↗
            </Link>
          )
        }
      />
      {q.isLoading ? (
        <div className="loading" />
      ) : !q.data ? (
        <ErrorState retry={() => q.refetch()} />
      ) : (
        <>
          <div className="kpi-grid">
            {Object.entries(q.data.data.metrics)
              .filter(([key]) => labels[key])
              .map(([key, value], i) => {
                const [en, ar, Icon] = labels[key];
                return (
                  <div
                    className={`card kpi kpi-${i % 4}`}
                    key={key}
                    data-tilt="4"
                  >
                    <div className="row between">
                      <span>{t(en, ar)}</span>
                      <span className="kpi-icon">
                        <Icon size={18} />
                      </span>
                    </div>
                    <strong>
                      <CountUp value={value} />
                    </strong>
                  </div>
                );
              })}
          </div>
          <div className="detail-grid dashboard-grid">
            <section className="card stack">
              <div className="row between">
                <h3>{t("Recent repairs", "أحدث الطلبات")}</h3>
                {permissions.includes("repairs.read") && (
                  <Link className="text-link" href="/app/repairs">
                    {t("View all", "عرض الكل")} ↗
                  </Link>
                )}
              </div>
              {q.data.data.recent_repairs.length ? (
                q.data.data.recent_repairs.map((r) => (
                  <Link
                    className="list-item"
                    href={`/app/repairs/${r.id}`}
                    key={r.id}
                  >
                    <div>
                      <strong>{r.reference}</strong>
                      <small>
                        {r.device?.brand} {r.device?.model}
                      </small>
                    </div>
                    <Status value={r.status || "received"} />
                  </Link>
                ))
              ) : (
                <EmptyState
                  title={t(
                    "Ready for your first repair",
                    "جاهز لأول طلب صيانة",
                  )}
                  description={t(
                    "Create a customer, register a device, then receive it for repair.",
                    "أضف العميل وسجّل الجهاز ثم استلمه للصيانة.",
                  )}
                />
              )}
            </section>
            <div className="stack">
              <section className="card stack">
                <h3>{t("Repair status overview", "توزيع حالات الصيانة")}</h3>
                <ul className="status-grid">
                  {q.data.data.status_counts.map((s) => (
                    <li key={s.status}>
                      <Status value={s.status} />
                      <strong>{s.count}</strong>
                    </li>
                  ))}
                </ul>
                {!q.data.data.status_counts.length && (
                  <p>
                    {t(
                      "Status counts appear as your work begins.",
                      "تظهر أعداد الحالات مع بدء العمل.",
                    )}
                  </p>
                )}
              </section>
              <section className="card stack">
                <h3>{t("Recent activity", "آخر الأنشطة")}</h3>
                {q.data.data.activity.length ? (
                  <ol className="timeline">
                    {q.data.data.activity.slice(0, 6).map((a) => {
                      const [en, ar] = activityLabels[a.event] ?? [
                        "Workspace update",
                        "تحديث في مساحة العمل",
                      ];
                      return (
                        <li key={a.id} data-kind={a.event.split(".")[0]}>
                          <span className="timeline-dot" aria-hidden="true" />
                          <div>
                            <strong>{t(en, ar)}</strong>
                            <time
                              dateTime={a.created_at}
                              title={formatDate(a.created_at, language, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            >
                              {formatRelative(a.created_at, language)}
                            </time>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="muted">
                    {t(
                      "Activity appears here as your team works.",
                      "تظهر الأنشطة هنا مع عمل فريقك.",
                    )}
                  </p>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
