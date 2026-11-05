"use client";
import { useEffect, useRef } from "react";
import { X, Inbox, LoaderCircle } from "lucide-react";
import { usePreferences } from "./providers";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = usePreferences();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-header">
        <h3 id="modal-title">{title}</h3>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Close dialog", "إغلاق النافذة")}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={34} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({ retry }: { retry: () => void }) {
  const { t } = usePreferences();
  return (
    <div className="error stack" role="alert">
      <strong>
        {t(
          "Something interrupted the connection.",
          "حدثت مشكلة أثناء الاتصال.",
        )}
      </strong>
      <p>
        {t(
          "Your changes have not been confirmed. Retry to load the latest records.",
          "لم يتم تأكيد أي تغيير. حاول مجددًا لتحميل أحدث البيانات.",
        )}
      </p>
      <button className="button secondary" onClick={retry}>
        {t("Try again", "حاول مجددًا")}
      </button>
    </div>
  );
}
export function SubmitButton({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="submit" className="button" disabled={busy}>
      {busy ? <LoaderCircle className="spin" size={18} /> : null}
      {children}
    </button>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
