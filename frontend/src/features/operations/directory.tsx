"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { api, post, patch } from "@/lib/api";
import { usePreferences } from "@/components/providers";
import { useWorkspace } from "@/components/workspace";
import { formatDate } from "@/lib/format";
import { Modal, PageHeading, EmptyState, ErrorState } from "@/components/ui";
import {
  RecordForm,
  RecordData,
  RecordsPage,
  Field,
  Pager,
  Status,
  useDebounced,
  statuses,
} from "./shared";
export type Resource = "customers" | "devices" | "repairs";
const names: Record<Resource, [string, string]> = {
  customers: ["Customers", "العملاء"],
  devices: ["Devices", "الأجهزة"],
  repairs: ["Repair orders", "طلبات الصيانة"],
};
function Editor({
  resource,
  item,
  onSaved,
}: {
  resource: Resource;
  item?: RecordData;
  onSaved: () => void;
}) {
  const { t } = usePreferences();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const term = useDebounced(search);
  const lookupResource = resource === "devices" ? "customers" : "devices";
  const lookup = useQuery({
    queryKey: ["lookup", lookupResource, term],
    queryFn: () =>
      api<RecordsPage>(`/${lookupResource}?search=${encodeURIComponent(term)}`),
    enabled: resource !== "customers" && !item,
  });
  const fields: Field[] =
    resource === "customers"
      ? [
          {
            name: "name",
            label: t("Full name", "الاسم الكامل"),
            required: true,
          },
          {
            name: "phone",
            label: t("Phone", "الهاتف"),
            type: "tel",
            required: true,
          },
          {
            name: "email",
            label: t("Email", "البريد الإلكتروني"),
            type: "email",
          },
          { name: "address", label: t("Address", "العنوان") },
          {
            name: "notes",
            label: t("Service notes", "ملاحظات الخدمة"),
            type: "textarea",
          },
        ]
      : resource === "devices"
        ? [
            ...(!item
              ? [
                  {
                    name: "customer_id",
                    label: t("Customer", "العميل"),
                    type: "select" as const,
                    required: true,
                    options: lookup.data?.data.map((c) => ({
                      value: String(c.id),
                      label: `${c.name} · ${c.phone}`,
                    })),
                  },
                ]
              : []),
            {
              name: "category",
              label: t("Category", "الفئة"),
              required: true,
              type: "select",
              options: [
                ["mobile", "Mobile phone", "هاتف محمول"],
                ["computer", "Computer / laptop", "كمبيوتر / لابتوب"],
                ["electronics", "Electronics", "إلكترونيات"],
                ["appliance", "Home appliance", "أجهزة منزلية"],
                ["general", "Other equipment", "معدات أخرى"],
              ].map(([value, en, ar]) => ({ value, label: t(en, ar) })),
            },
            {
              name: "brand",
              label: t("Brand", "العلامة التجارية"),
              required: true,
            },
            { name: "model", label: t("Model", "الموديل"), required: true },
            {
              name: "serial_number",
              label: t(
                "Serial / IMEI (optional)",
                "الرقم التسلسلي / IMEI (اختياري)",
              ),
            },
            {
              name: "description",
              label: t("Description", "الوصف"),
              type: "textarea",
            },
          ]
        : [
            {
              name: "device_id",
              label: t("Device", "الجهاز"),
              type: "select",
              required: true,
              options: lookup.data?.data.map((d) => ({
                value: String(d.id),
                label: `${d.brand} ${d.model} · ${d.customer?.name}`,
              })),
            },
            {
              name: "priority",
              label: t("Priority", "الأولوية"),
              type: "select",
              required: true,
              options: [
                ["low", "Low", "منخفضة"],
                ["normal", "Normal", "عادية"],
                ["high", "High", "مرتفعة"],
                ["urgent", "Urgent", "عاجلة"],
              ].map(([value, en, ar]) => ({ value, label: t(en, ar) })),
            },
            {
              name: "reported_problem",
              label: t("Reported problem", "المشكلة المبلغ عنها"),
              type: "textarea",
              required: true,
            },
            {
              name: "device_condition",
              label: t(
                "Device condition at intake",
                "حالة الجهاز عند الاستلام",
              ),
              type: "textarea",
              required: true,
            },
            { name: "accessories", label: t("Accessories", "الملحقات") },
            {
              name: "expected_at",
              label: t("Expected completion", "الإتمام المتوقع"),
              type: "date",
            },
          ];
  const initial = item
    ? Object.fromEntries(
        fields.map((f) => [
          f.name,
          item[f.name as keyof RecordData] as string | number | undefined,
        ]),
      )
    : { priority: "normal" };
  return (
    <div className="stack">
      {resource !== "customers" && !item && (
        <label className="field">
          {t(
            `Find ${lookupResource === "customers" ? "customer" : "device"}`,
            lookupResource === "customers"
              ? "ابحث عن العميل"
              : "ابحث عن الجهاز",
          )}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "Type a name, brand or model…",
              "اكتب الاسم أو العلامة أو الموديل…",
            )}
          />
        </label>
      )}
      <RecordForm
        fields={fields}
        initial={initial}
        submit={async (v) => {
          const result = await (item
            ? patch<{ data: RecordData }>(`/${resource}/${item.id}`, v)
            : post<{ data: RecordData }>(`/${resource}`, v));
          if (resource === "repairs")
            router.push(`/app/repairs/${result.data.id}`);
          return result;
        }}
        onSaved={onSaved}
        label={t("Save record", "حفظ السجل")}
      />
    </div>
  );
}
export function Directory({ resource }: { resource: Resource }) {
  const { t } = usePreferences();
  const { permissions } = useWorkspace();
  const can = permissions.includes(resource + ".write");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const term = useDebounced(search);
  const [create, setCreate] = useState(false);
  const q = useQuery({
    queryKey: [resource, term, page, status],
    queryFn: () =>
      api<RecordsPage>(
        `/${resource}?search=${encodeURIComponent(term)}&page=${page}&status=${status}`,
      ),
  });
  return (
    <>
      <PageHeading
        eyebrow={t("CONNECTED WORKSPACE", "مساحة عمل مترابطة")}
        title={t(...names[resource])}
        description={t(
          "Organized records. A clearer working day.",
          "سجلات منظمة، ويوم عمل أوضح.",
        )}
        action={
          can && (
            <button className="button" onClick={() => setCreate(true)}>
              <Plus size={17} />
              {t("Add new", "إضافة جديد")}
            </button>
          )
        }
      />
      <section className="card table-card">
        <div className="table-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label={t("Search records", "البحث في السجلات")}
              placeholder={t("Search records…", "البحث في السجلات…")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {resource === "repairs" && (
            <select
              aria-label={t("Filter by status", "تصفية بالحالة")}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("All statuses", "كل الحالات")}</option>
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(...label)}
                </option>
              ))}
            </select>
          )}
        </div>
        {q.isLoading ? (
          <div className="loading" />
        ) : q.error ? (
          <ErrorState retry={() => q.refetch()} />
        ) : !q.data?.data.length ? (
          <EmptyState
            title={t("Your next record starts here", "سجلك التالي يبدأ من هنا")}
            description={t(
              "Add a record or adjust your search to see results.",
              "أضف سجلًا أو عدّل البحث لعرض النتائج.",
            )}
          />
        ) : (
          <>
            <div className="table-scroll">
              {/* Explicit roles keep table semantics when narrow screens
                  restyle rows as cards. */}
              <table className="data-table" role="table">
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader">{t("Record", "السجل")}</th>
                    <th role="columnheader">{t("Details", "التفاصيل")}</th>
                    <th role="columnheader">
                      {t("Status / activity", "الحالة / النشاط")}
                    </th>
                    <th role="columnheader">{t("Open", "فتح")}</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {q.data.data.map((r) => (
                    <tr key={r.id} role="row">
                      <td role="cell">
                        <Link
                          className="text-link"
                          href={`/app/${resource}/${r.id}`}
                        >
                          {resource === "customers"
                            ? r.name
                            : resource === "devices"
                              ? `${r.brand} ${r.model}`
                              : r.reference}
                        </Link>
                        {r.device && (
                          <small>
                            {r.device.brand} {r.device.model}
                          </small>
                        )}
                      </td>
                      <td role="cell" data-label={t("Details", "التفاصيل")}>
                        {resource === "customers"
                          ? r.phone
                          : r.customer?.name || "—"}
                        <small>
                          {resource === "customers"
                            ? r.email
                            : resource === "devices"
                              ? r.serial_number
                              : r.technician?.name}
                        </small>
                      </td>
                      <td
                        role="cell"
                        data-label={t("Status / activity", "الحالة / النشاط")}
                      >
                        {resource === "repairs" ? (
                          <Status value={r.status || "received"} />
                        ) : resource === "customers" ? (
                          t(
                            `${r.devices_count || 0} devices · ${r.repairs_count || 0} repairs`,
                            `${r.devices_count || 0} أجهزة · ${r.repairs_count || 0} طلبات`,
                          )
                        ) : (
                          r.category
                        )}
                      </td>
                      <td role="cell" className="data-table-action">
                        <Link
                          href={`/app/${resource}/${r.id}`}
                          className="button secondary"
                        >
                          {t("View", "عرض")} ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager data={q.data} onPage={setPage} />
          </>
        )}
      </section>
      {create && (
        <Modal
          title={t("Create record", "إنشاء سجل")}
          onClose={() => setCreate(false)}
        >
          <Editor resource={resource} onSaved={() => setCreate(false)} />
        </Modal>
      )}
    </>
  );
}
const priorityLabels: Record<string, [string, string]> = {
  low: ["Low", "منخفضة"],
  normal: ["Normal", "عادية"],
  high: ["High", "عالية"],
  urgent: ["Urgent", "عاجلة"],
};
export function RecordDetail({
  resource,
  id,
}: {
  resource: Resource;
  id: string;
}) {
  const { t, language } = usePreferences();
  const { permissions } = useWorkspace();
  const [action, setAction] = useState("");
  const q = useQuery({
    queryKey: [resource, id],
    queryFn: () => api<{ data: RecordData }>(`/${resource}/${id}`),
  });
  const techs = useQuery({
    queryKey: ["technicians"],
    queryFn: () =>
      api<{ data: { id: number; name: string }[] }>("/technicians"),
    enabled: resource === "repairs" && permissions.includes("repairs.assign"),
  });
  if (q.isLoading) return <div className="loading" />;
  if (!q.data) return <ErrorState retry={() => q.refetch()} />;
  const r = q.data.data;
  const title =
    resource === "customers"
      ? r.name
      : resource === "devices"
        ? `${r.brand} ${r.model}`
        : r.reference;
  const closed = ["delivered", "cancelled", "returned_without_repair"].includes(
    r.status || "",
  );
  const edit = permissions.includes(resource + ".write");
  return (
    <>
      <PageHeading
        title={title || ""}
        description={r.phone || r.serial_number}
        action={
          r.status ? (
            <Status value={r.status} />
          ) : (
            edit && (
              <button
                className="button secondary"
                onClick={() => setAction("edit")}
              >
                {t("Edit details", "تعديل البيانات")}
              </button>
            )
          )
        }
      />
      {resource === "repairs" && (
        <div className="repair-actions">
          {permissions.includes("repairs.assign") && !closed && (
            <button
              className="button secondary"
              onClick={() => setAction("assign")}
            >
              {t("Assign technician", "إسناد إلى فني")}
            </button>
          )}
          {permissions.includes("repairs.diagnose") &&
            ["awaiting_diagnosis", "diagnosing"].includes(r.status || "") && (
              <button className="button" onClick={() => setAction("diagnosis")}>
                {t("Record diagnosis", "تسجيل الفحص")}
              </button>
            )}
          {r.allowed_transitions?.map((s) => (
            <button
              className="button secondary"
              key={s}
              onClick={() => setAction(s)}
            >
              {t(...statuses[s])}
            </button>
          ))}
          {edit && !closed && (
            <button
              className="button secondary"
              onClick={() => setAction("notes")}
            >
              {t("Edit notes", "تعديل الملاحظات")}
            </button>
          )}
        </div>
      )}
      <div className="detail-grid">
        <section className="card stack">
          <h3>{t("Details", "التفاصيل")}</h3>
          {(r.customer || r.device || resource === "repairs") && (
            <dl className="detail-fields">
              {r.customer && (
                <div>
                  <dt>{t("Customer", "العميل")}</dt>
                  <dd>
                    <Link
                      className="text-link"
                      href={`/app/customers/${r.customer.id}`}
                    >
                      {r.customer.name}
                    </Link>
                    <small dir="ltr">{r.customer.phone}</small>
                  </dd>
                </div>
              )}
              {r.device && (
                <div>
                  <dt>{t("Device", "الجهاز")}</dt>
                  <dd>
                    <Link
                      className="text-link"
                      href={`/app/devices/${r.device.id}`}
                    >
                      {r.device.brand} {r.device.model}
                    </Link>
                  </dd>
                </div>
              )}
              {resource === "repairs" && (
                <div>
                  <dt>{t("Technician", "الفني")}</dt>
                  <dd>
                    {r.technician?.name ??
                      t("Not assigned yet", "لم يُسند بعد")}
                  </dd>
                </div>
              )}
              {r.priority && (
                <div>
                  <dt>{t("Priority", "الأولوية")}</dt>
                  <dd>
                    {t(
                      ...(priorityLabels[r.priority] ?? [
                        r.priority,
                        r.priority,
                      ]),
                    )}
                  </dd>
                </div>
              )}
              {r.received_at && (
                <div>
                  <dt>{t("Received", "تاريخ الاستلام")}</dt>
                  <dd>{formatDate(r.received_at, language)}</dd>
                </div>
              )}
              {r.expected_at && (
                <div>
                  <dt>{t("Expected", "الموعد المتوقع")}</dt>
                  <dd>{formatDate(r.expected_at, language)}</dd>
                </div>
              )}
            </dl>
          )}
          {[
            ["Email", "البريد", r.email],
            ["Address", "العنوان", r.address],
            ["Reported problem", "المشكلة المبلغ عنها", r.reported_problem],
            ["Device condition", "حالة الجهاز", r.device_condition],
            ["Accessories", "الملحقات", r.accessories],
            ["Notes", "ملاحظات", r.notes || r.description],
            ["Internal notes", "ملاحظات داخلية", r.internal_notes],
            ["Customer-visible notes", "ملاحظات تظهر للعميل", r.customer_notes],
          ]
            .filter((v) => v[2])
            .map(([en, ar, value]) => (
              <div key={en}>
                <small className="muted">{t(en!, ar!)}</small>
                <p className="preserve" dir="auto">
                  {value}
                </p>
              </div>
            ))}
          {r.diagnoses?.map((d) => (
            <div className="note-card" key={d.id}>
              <strong>{t("Diagnosis", "الفحص")}</strong>
              <p>{d.findings}</p>
              <small>{t("Recommended work", "العمل الموصى به")}</small>
              <p>{d.recommended_work}</p>
            </div>
          ))}
        </section>
        <section className="card stack">
          <h3>
            {resource === "repairs"
              ? t("Repair timeline", "الخط الزمني للصيانة")
              : t("Service history", "سجل الخدمة")}
          </h3>
          {!!r.histories?.length && (
            <ol className="timeline repair-timeline">
              {r.histories.map((h) => (
                <li key={h.id}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <div>
                    <Status value={h.to_status} />
                    <time dateTime={h.created_at}>
                      {formatDate(h.created_at, language, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                    {h.note && <p dir="auto">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {r.repairs?.map((order) => (
            <Link
              className="list-item"
              key={order.id}
              href={`/app/repairs/${order.id}`}
            >
              <strong>{order.reference}</strong>
              <Status value={order.status || "received"} />
            </Link>
          ))}
          {r.devices?.map((d) => (
            <Link
              className="list-item"
              key={d.id}
              href={`/app/devices/${d.id}`}
            >
              {d.brand} {d.model}
            </Link>
          ))}
        </section>
      </div>
      {action && (
        <Modal
          title={
            action === "edit"
              ? t("Edit record", "تعديل السجل")
              : action === "assign"
                ? t("Assign technician", "إسناد إلى فني")
                : action === "diagnosis"
                  ? t("Record diagnosis", "تسجيل الفحص")
                  : action === "notes"
                    ? t("Repair notes", "ملاحظات الطلب")
                    : t(...statuses[action])
          }
          onClose={() => setAction("")}
        >
          {action === "edit" ? (
            <Editor
              resource={resource}
              item={r}
              onSaved={() => setAction("")}
            />
          ) : (
            <RecordForm
              fields={
                action === "assign"
                  ? [
                      {
                        name: "technician_id",
                        label: t("Technician", "الفني"),
                        type: "select",
                        required: true,
                        options: techs.data?.data.map((u) => ({
                          value: String(u.id),
                          label: u.name,
                        })),
                      },
                    ]
                  : action === "diagnosis"
                    ? [
                        {
                          name: "findings",
                          label: t("Findings", "نتائج الفحص"),
                          type: "textarea",
                          required: true,
                        },
                        {
                          name: "recommended_work",
                          label: t("Recommended work", "العمل الموصى به"),
                          type: "textarea",
                          required: true,
                        },
                      ]
                    : action === "notes"
                      ? [
                          {
                            name: "internal_notes",
                            label: t(
                              "Internal notes — never enter device passwords",
                              "ملاحظات داخلية — لا تسجّل كلمات مرور الأجهزة",
                            ),
                            type: "textarea",
                          },
                          {
                            name: "customer_notes",
                            label: t(
                              "Customer-visible instructions",
                              "تعليمات تظهر للعميل",
                            ),
                            type: "textarea",
                          },
                        ]
                      : [
                          {
                            name:
                              action === "ready_for_pickup"
                                ? "quality_check_notes"
                                : "note",
                            label: t(
                              "Reason / inspection notes",
                              "السبب / نتيجة الفحص",
                            ),
                            type: "textarea",
                            required: action === "ready_for_pickup",
                          },
                        ]
              }
              initial={
                action === "notes"
                  ? {
                      internal_notes: r.internal_notes,
                      customer_notes: r.customer_notes,
                    }
                  : undefined
              }
              submit={(v) =>
                action === "notes"
                  ? patch(`/repairs/${id}`, v)
                  : post(
                      `/repairs/${id}/${action === "assign" ? "assign" : action === "diagnosis" ? "diagnosis" : "transition"}`,
                      action === "assign" || action === "diagnosis"
                        ? v
                        : { ...v, status: action, expected_status: r.status },
                    )
              }
              onSaved={() => setAction("")}
              label={t("Confirm action", "تأكيد الإجراء")}
            />
          )}
        </Modal>
      )}
    </>
  );
}
