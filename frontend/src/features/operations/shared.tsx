"use client";
import { useId, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { usePreferences } from "@/components/providers";
import { SubmitButton } from "@/components/ui";
export type Option = { value: string; label: string };
export type Field = {
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "tel" | "email" | "password" | "textarea" | "select" | "date";
  options?: Option[];
};
export type RecordData = {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  category?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  description?: string;
  customer_id?: number;
  reference?: string;
  status?: string;
  priority?: string;
  reported_problem?: string;
  device_condition?: string;
  accessories?: string;
  internal_notes?: string;
  customer_notes?: string;
  received_at?: string;
  expected_at?: string;
  devices_count?: number;
  repairs_count?: number;
  customer?: RecordData;
  device?: RecordData;
  technician?: { id: number; name: string };
  devices?: RecordData[];
  repairs?: RecordData[];
  allowed_transitions?: string[];
  histories?: {
    id: number;
    to_status: string;
    created_at: string;
    note?: string;
  }[];
  diagnoses?: { id: number; findings: string; recommended_work: string }[];
};
export type RecordsPage = {
  data: RecordData[];
  current_page: number;
  last_page: number;
  total: number;
  meta?: { current_page: number; last_page: number; total: number };
};
export const statuses: Record<string, [string, string]> = {
  received: ["Received", "تم الاستلام"],
  awaiting_diagnosis: ["Awaiting diagnosis", "بانتظار الفحص"],
  diagnosing: ["Diagnosing", "جارٍ الفحص"],
  awaiting_customer_approval: ["Awaiting approval", "بانتظار الموافقة"],
  approved: ["Approved", "تمت الموافقة"],
  in_repair: ["In repair", "جارٍ الإصلاح"],
  awaiting_parts: ["Awaiting parts", "بانتظار القطع"],
  quality_check: ["Quality check", "اختبار الجودة"],
  ready_for_pickup: ["Ready for pickup", "جاهز للاستلام"],
  delivered: ["Delivered", "تم التسليم"],
  cancelled: ["Cancelled", "ملغي"],
  unrepairable: ["Unrepairable", "غير قابل للإصلاح"],
  estimate_rejected: ["Estimate rejected", "العرض مرفوض"],
  returned_without_repair: ["Returned without repair", "أعيد دون إصلاح"],
};
export const roleLabels: Record<string, [string, string]> = {
  owner: ["Owner", "المالك"],
  manager: ["Manager", "مدير"],
  receptionist: ["Receptionist", "موظف استقبال"],
  technician: ["Technician", "فني"],
  inventory_manager: ["Inventory manager", "مسؤول المخزون"],
  accountant: ["Accountant", "محاسب"],
};
export function Status({ value }: { value: string }) {
  const { t } = usePreferences();
  return (
    <span className={`badge status-${value}`}>
      {statuses[value] ? t(...statuses[value]) : value}
    </span>
  );
}
export function RecordForm({
  fields,
  initial = {},
  submit,
  onSaved,
  label,
}: {
  fields: Field[];
  initial?: Record<string, string | number | null | undefined>;
  submit: (v: Record<string, string>) => Promise<unknown>;
  onSaved: () => void;
  label?: string;
}) {
  const { t } = usePreferences();
  const client = useQueryClient();
  const id = useId();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(
      fields.map((f) => [f.name, String(initial[f.name] ?? "")]),
    ),
  });
  return (
    <form
      className="form-grid"
      onSubmit={handleSubmit(async (values) => {
        setError("");
        const schema = z.object(
          Object.fromEntries(
            fields.map((f) => [
              f.name,
              f.required
                ? z.string().min(1, t("Required field", "حقل مطلوب"))
                : z.string(),
            ]),
          ),
        );
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
          parsed.error.issues.forEach((e) =>
            setFieldError(String(e.path[0]), { message: e.message }),
          );
          return;
        }
        try {
          await submit(values);
          await client.invalidateQueries();
          onSaved();
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : t("Could not save.", "تعذر الحفظ."),
          );
          if (e instanceof ApiError)
            Object.entries(e.errors).forEach(([key, msg]) =>
              setFieldError(key, { message: msg[0] }),
            );
        }
      })}
    >
      {fields.map((f) => (
        <div
          key={f.name}
          className={`field ${f.type === "textarea" ? "span-all" : ""}`}
        >
          <label htmlFor={id + f.name}>
            {f.label}
            {f.required ? " *" : ""}
          </label>
          {f.type === "select" ? (
            <select
              id={id + f.name}
              aria-label={f.label}
              {...register(f.name)}
              required={f.required}
            >
              <option value="">{t("Select…", "اختر…")}</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              id={id + f.name}
              aria-label={f.label}
              {...register(f.name)}
              required={f.required}
              maxLength={5000}
            />
          ) : (
            <input
              id={id + f.name}
              aria-label={f.label}
              {...register(f.name)}
              required={f.required}
              type={f.type || "text"}
              maxLength={1000}
            />
          )}
          {errors[f.name] && (
            <small role="alert" className="field-error">
              {errors[f.name]?.message}
            </small>
          )}
        </div>
      ))}
      {error && (
        <p className="error span-all" role="alert">
          {error}
        </p>
      )}
      <div className="span-all">
        <SubmitButton busy={isSubmitting}>
          {label || t("Save changes", "حفظ التغييرات")}
        </SubmitButton>
      </div>
    </form>
  );
}
export function useDebounced(value: string) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return result;
}
export function Pager({
  data,
  onPage,
}: {
  data: RecordsPage;
  onPage: (n: number) => void;
}) {
  const { t } = usePreferences();
  const m = data.meta || data;
  return (
    <div className="pagination">
      <span>
        {t(
          `${m.total} records · Page ${m.current_page} of ${m.last_page}`,
          `${m.total} سجل · صفحة ${m.current_page} من ${m.last_page}`,
        )}
      </span>
      <div className="row">
        <button
          className="button secondary"
          disabled={m.current_page <= 1}
          onClick={() => onPage(m.current_page - 1)}
        >
          {t("Previous", "السابق")}
        </button>
        <button
          className="button secondary"
          disabled={m.current_page >= m.last_page}
          onClick={() => onPage(m.current_page + 1)}
        >
          {t("Next", "التالي")}
        </button>
      </div>
    </div>
  );
}
