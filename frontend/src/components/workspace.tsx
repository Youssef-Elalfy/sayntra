"use client";
import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Laptop,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  Command,
} from "lucide-react";
import { api, post, ApiError } from "@/lib/api";
import { Logo, Preferences } from "./brand";
import { usePreferences } from "./providers";
export type Organization = {
  id: number;
  name: string;
  currency: string;
  timezone: string;
  tax_basis_points: number;
  warranty_days: number;
  email: string;
  phone: string;
  address: string;
  category: string;
};
export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
};
type WorkspaceData = {
  organization: Organization;
  user: CurrentUser;
  permissions: string[];
  role: string;
};
const WorkspaceContext = createContext<WorkspaceData | null>(null);
export function useWorkspace() {
  const c = useContext(WorkspaceContext);
  if (!c) throw new Error("Missing workspace");
  return c;
}
export const navigation = [
  ["", "Overview", "نظرة عامة", LayoutDashboard, ""],
  ["repairs", "Repair orders", "طلبات الصيانة", Wrench, "repairs.read"],
  ["customers", "Customers", "العملاء", Users, "customers.read"],
  ["devices", "Devices", "الأجهزة", Laptop, "devices.read"],
  ["team", "Team & roles", "الفريق والصلاحيات", UserCog, "team.manage"],
  ["settings", "Settings", "الإعدادات", Settings, ""],
] as const;
export default function Workspace({ children }: { children: React.ReactNode }) {
  const { t } = usePreferences();
  const router = useRouter();
  const path = usePathname();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const user = useQuery({
    queryKey: ["user"],
    queryFn: () => api<{ data: CurrentUser }>("/auth/user"),
    retry: false,
  });
  const org = useQuery({
    queryKey: ["organization"],
    queryFn: () =>
      api<{ data: Organization; permissions: string[]; role: string }>(
        "/organization",
      ),
    enabled: !!user.data?.data?.email_verified_at,
    retry: false,
  });
  if (user.isLoading || (user.data?.data?.email_verified_at && org.isLoading))
    return (
      <main id="main" className="workspace-loading">
        <Logo />
        <div className="loading" />
        <p role="status">
          {t("Opening your workspace…", "جارٍ فتح مساحة العمل…")}
        </p>
      </main>
    );
  if (user.error)
    return (
      <main id="main" className="empty">
        <Logo />
        <h3>{t("Sign in to continue", "سجّل الدخول للمتابعة")}</h3>
        <p>
          {user.error instanceof ApiError && user.error.status === 401
            ? t("Your session has ended.", "انتهت جلستك.")
            : t(
                "We could not connect to your workspace.",
                "تعذر الاتصال بمساحة العمل.",
              )}
        </p>
        <Link className="button" href="/login">
          {t("Sign in", "دخول")}
        </Link>
      </main>
    );
  if (!user.data?.data?.email_verified_at)
    return (
      <main id="main" className="empty">
        <h3>{t("Verify your email first.", "أكّد بريدك الإلكتروني أولًا.")}</h3>
        <Link className="button" href="/verify-email">
          {t("Email verification", "تأكيد البريد")}
        </Link>
      </main>
    );
  if (!org.data)
    return (
      <main id="main" className="empty">
        <h3>{t("Workspace unavailable", "مساحة العمل غير متاحة")}</h3>
        <p>
          {t(
            "Check your connection and active organization membership.",
            "راجع اتصالك وعضويتك الفعّالة في المؤسسة.",
          )}
        </p>
        <button className="button" onClick={() => org.refetch()}>
          {t("Try again", "حاول مرة أخرى")}
        </button>
      </main>
    );
  const active =
    navigation.find(([route]) => path === `/app${route ? "/" + route : ""}`) ||
    navigation[1];
  return (
    <WorkspaceContext.Provider
      value={{
        organization: org.data.data,
        user: user.data.data,
        permissions: org.data.permissions,
        role: org.data.role,
      }}
    >
      <div className="workspace-shell">
        {open && (
          <button
            aria-label={t("Close navigation", "إغلاق القائمة")}
            className="sidebar-overlay"
            onClick={() => setOpen(false)}
          />
        )}
        <aside className={`sidebar ${open ? "expanded" : ""}`}>
          <div className="sidebar-logo">
            <Logo />
            <button
              className="icon-button mobile-menu"
              aria-label={t("Close navigation", "إغلاق القائمة")}
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="workspace-selector">
            <span className="org-icon">{org.data.data.name.slice(0, 1)}</span>
            <div>
              <strong>{org.data.data.name}</strong>
              <small>{t("Business workspace", "مساحة عمل المركز")}</small>
            </div>
          </div>
          <span className="sidebar-label">{t("WORKSPACE", "مساحة العمل")}</span>
          <nav aria-label={t("Workspace navigation", "قائمة مساحة العمل")}>
            {navigation
              .filter(
                ([, , , , permission]) =>
                  !permission || org.data.permissions.includes(permission),
              )
              .map(([route, en, ar, Icon]) => (
                <Link
                  key={route}
                  href={`/app${route ? "/" + route : ""}`}
                  onClick={() => setOpen(false)}
                  className={
                    path === `/app${route ? "/" + route : ""}` ||
                    (route === "repairs" && path.startsWith("/app/repairs/"))
                      ? "active"
                      : ""
                  }
                >
                  <Icon size={18} />
                  <span>{t(en, ar)}</span>
                  {route === "repairs" && (
                    <span className="nav-shortcut">↗</span>
                  )}
                </Link>
              ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="workspace-note">
              <Command size={21} />
              <strong>{t("Everything, connected.", "كل شغلك، مترابط.")}</strong>
              <p>
                {t(
                  "A little more clarity in every day.",
                  "تفاصيل أوضح في كل يوم.",
                )}
              </p>
            </div>
            <button
              className="profile-button"
              onClick={async () => {
                try {
                  await post("/auth/logout", {});
                  client.clear();
                  router.replace("/login");
                  router.refresh();
                } catch {
                  setLogoutError(
                    t(
                      "Could not sign out. Try again.",
                      "تعذر تسجيل الخروج. حاول مجددًا.",
                    ),
                  );
                }
              }}
            >
              <span className="avatar">{user.data.data.name.slice(0, 1)}</span>
              <span>
                <strong>{user.data.data.name}</strong>
                <small>{t("Sign out", "تسجيل الخروج")}</small>
              </span>
              <LogOut size={17} />
            </button>
            {logoutError && <p role="alert">{logoutError}</p>}
          </div>
        </aside>
        <div className="workspace-main">
          <header className="workspace-header">
            <div className="row">
              <button
                className="icon-button mobile-menu"
                aria-label={t("Open navigation", "فتح القائمة")}
                onClick={() => setOpen(true)}
              >
                <Menu size={19} />
              </button>
              <span className="breadcrumb">
                {t("Workspace", "مساحة العمل")}
                <span>/</span>
                <strong>{t(active[1], active[2])}</strong>
              </span>
            </div>
            <div className="row header-actions">
              <Preferences />
              <span className="avatar small-avatar">
                {user.data.data.name.slice(0, 1)}
              </span>
            </div>
          </header>
          <motion.main
            id="main"
            className="workspace-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.main>
          <footer className="workspace-footer">
            <span>
              SAYNTRA ·{" "}
              {t(
                "Smarter Repairs. Better Business.",
                "صيانة أذكى. أعمال أفضل.",
              )}
            </span>
            <span>
              {org.data.data.currency} · {org.data.data.timezone}
            </span>
          </footer>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
