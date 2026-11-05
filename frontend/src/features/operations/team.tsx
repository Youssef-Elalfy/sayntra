"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, post, patch } from "@/lib/api";
import { usePreferences } from "@/components/providers";
import { Modal, PageHeading, ErrorState } from "@/components/ui";
import { RecordForm, roleLabels } from "./shared";
type Member = {
  id: number;
  role: string;
  active: boolean;
  user: { name: string; email: string };
};
export default function Team() {
  const { t } = usePreferences();
  const [edit, setEdit] = useState<Member | null | false>(false);
  const [notice, setNotice] = useState("");
  const q = useQuery({
    queryKey: ["team"],
    queryFn: () => api<{ data: Member[] }>("/team"),
  });
  return (
    <>
      <PageHeading
        title={t("Team & permissions", "الفريق والصلاحيات")}
        description={t(
          "The right access for every role in your workshop.",
          "الصلاحيات المناسبة لكل دور داخل مركزك.",
        )}
        action={
          <button className="button" onClick={() => setEdit(null)}>
            {t("Invite teammate", "دعوة عضو للفريق")}
          </button>
        }
      />
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      <section className="card">
        {q.isLoading ? (
          <div className="loading" />
        ) : !q.data ? (
          <ErrorState retry={() => q.refetch()} />
        ) : (
          q.data.data.map((m) => (
            <div className="list-item" key={m.id}>
              <div>
                <strong>{m.user.name}</strong>
                <small>{m.user.email}</small>
                <small>
                  {t(...roleLabels[m.role])} ·{" "}
                  {m.active ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                </small>
              </div>
              <button className="button secondary" onClick={() => setEdit(m)}>
                {t("Manage access", "إدارة الوصول")}
              </button>
            </div>
          ))
        )}
      </section>
      {edit !== false && (
        <Modal
          title={
            edit
              ? t("Update membership", "تحديث العضوية")
              : t("Invite by email", "دعوة بالبريد")
          }
          onClose={() => setEdit(false)}
        >
          <RecordForm
            fields={[
              ...(!edit
                ? [
                    {
                      name: "email",
                      label: t("Email address", "البريد الإلكتروني"),
                      type: "email" as const,
                      required: true,
                    },
                  ]
                : []),
              {
                name: "role",
                label: t("Role", "الدور"),
                type: "select",
                required: true,
                options: Object.entries(roleLabels).map(([value, label]) => ({
                  value,
                  label: t(...label),
                })),
              },
              ...(edit
                ? [
                    {
                      name: "active",
                      label: t("Status", "الحالة"),
                      type: "select" as const,
                      required: true,
                      options: [
                        { value: "1", label: t("Active", "نشط") },
                        { value: "0", label: t("Inactive", "غير نشط") },
                      ],
                    },
                  ]
                : []),
            ]}
            initial={
              edit
                ? { role: edit.role, active: edit.active ? "1" : "0" }
                : { role: "technician" }
            }
            submit={(v) =>
              edit
                ? patch(`/team/${edit.id}`, {
                    role: v.role,
                    active: v.active === "1",
                  })
                : post("/team/invitations", v)
            }
            onSaved={() => {
              setNotice(
                edit
                  ? t("Membership updated.", "تم تحديث العضوية.")
                  : t(
                      "Invitation created using the configured mail service.",
                      "تم إنشاء الدعوة عبر خدمة البريد المهيأة.",
                    ),
              );
              setEdit(false);
            }}
          />
        </Modal>
      )}
    </>
  );
}
