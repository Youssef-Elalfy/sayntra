"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  CheckCircle2,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { Logo, Preferences, LivingNetwork } from "@/components/brand";
import { usePreferences } from "@/components/providers";
import { ProductPreview } from "./landing";
import { HeroDevice } from "./repair-story";
import { AmbientBackdrop } from "./ambient";
import { ApiError, post } from "@/lib/api";
type Mode = "login" | "register" | "forgot-password" | "reset-password";
export function AuthPage({ mode }: { mode: Mode }) {
  const { t, language } = usePreferences();
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const schema = z
    .object({
      email: z.email(
        t("Enter a valid email address.", "اكتب بريد إلكتروني صحيح."),
      ),
      password: z.string().optional(),
      password_confirmation: z.string().optional(),
      name: z.string().optional(),
      organization_name: z.string().optional(),
      category: z.string().optional(),
      phone: z.string().optional(),
      remember: z.boolean().optional(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: "custom", path: [path], message });
      if (mode !== "forgot-password" && !v.password)
        issue("password", t("Password is required.", "كلمة المرور مطلوبة."));
      if (["register", "reset-password"].includes(mode)) {
        if (
          !v.password ||
          v.password.length < 12 ||
          !/[a-z]/.test(v.password) ||
          !/[A-Z]/.test(v.password) ||
          !/[0-9]/.test(v.password)
        )
          issue(
            "password",
            t(
              "Use 12+ characters, upper/lowercase letters and a number.",
              "استخدم 12 حرفًا على الأقل، حروف إنجليزية كبيرة وصغيرة ورقم.",
            ),
          );
        if (v.password !== v.password_confirmation)
          issue(
            "password_confirmation",
            t("Passwords do not match.", "كلمتا المرور غير متطابقتين."),
          );
      }
      if (mode === "register") {
        if (!v.name?.trim())
          issue("name", t("Name is required.", "الاسم مطلوب."));
        if (!v.organization_name?.trim())
          issue(
            "organization_name",
            t("Business name is required.", "اسم المركز مطلوب."),
          );
        if (!v.category)
          issue(
            "category",
            t("Select a business category.", "اختر نوع النشاط."),
          );
      }
    });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setError: fieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: params.get("email") || "",
      remember: false,
      category: "general",
    },
  });
  async function submit(values: Values) {
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...values,
        ...(mode === "register" ? { country: "EG", language } : {}),
        ...(mode === "reset-password" ? { token: params.get("token") } : {}),
      };
      await post(
        `/auth/${mode === "forgot-password" ? "forgot-password" : mode}`,
        payload,
      );
      if (mode === "forgot-password") {
        setSuccess(
          t(
            "If this email is registered, a reset link has been sent.",
            "لو البريد مسجّل، هيوصلك رابط لإعادة تعيين كلمة المرور.",
          ),
        );
        return;
      }
      if (mode === "reset-password") {
        setSuccess(
          t(
            "Password updated. You can now sign in.",
            "تم تغيير كلمة المرور. يمكنك تسجيل الدخول.",
          ),
        );
        return;
      }
      setSuccess(
        t(
          "You’re in. Opening your workspace…",
          "تم الدخول. جارٍ فتح مساحة عملك…",
        ),
      );
      router.replace(mode === "register" ? "/verify-email" : "/app");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        Object.entries(e.errors).forEach(([key, messages]) =>
          fieldError(key as keyof Values, { message: messages[0] }),
        );
        setError(e.message);
      } else
        setError(
          t(
            "Unable to connect. Please try again.",
            "تعذر الاتصال. حاول مرة أخرى.",
          ),
        );
    }
  }
  const titles = {
    login: [
      t("Welcome back.", "أهلًا برجوعك."),
      t(
        "Your next great repair starts here.",
        "كل طلب صيانة ناجح بيبدأ من هنا.",
      ),
    ],
    register: [
      t("A better way to work.", "بداية أذكى لشغلك."),
      t(
        "Create your account and repair workspace.",
        "أنشئ حسابك ومساحة عمل مركز الصيانة.",
      ),
    ],
    "forgot-password": [
      t("Let’s get you back in.", "نرجّعك لحسابك."),
      t(
        "We’ll send a secure link to your email.",
        "هنبعت رابط آمن لبريدك الإلكتروني.",
      ),
    ],
    "reset-password": [
      t("A fresh start.", "كلمة مرور جديدة."),
      t(
        "Choose a strong password for your account.",
        "اختار كلمة مرور قوية لحسابك.",
      ),
    ],
  };
  const input = (
    name: keyof Values,
    label: string,
    type = "text",
    autoComplete?: string,
  ) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
        {...register(name)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <small className="field-error" id={`${name}-error`}>
          {errors[name]?.message}
        </small>
      )}
    </div>
  );
  return (
    <main
      id="main"
      className="auth-layout"
      data-state={success && mode === "login" ? "success" : undefined}
    >
      <AmbientBackdrop />
      <aside className="auth-brand">
        <LivingNetwork />
        <div className="auth-brand-top">
          <Logo />
          <span className="badge">
            {t("CONNECTED BY DESIGN", "مترابطة من الأساس")}
          </span>
        </div>
        <div className="auth-story">
          <span className="eyebrow">
            {t("Smarter repairs. Better business.", "صيانة أذكى. أعمال أفضل.")}
          </span>
          <h1>
            {t("More clarity.", "تنظيم أوضح.")}
            <br />
            {t("Less busywork.", "ومجهود أقل.")}
            <br />
            <span className="gradient-text">
              {t("That’s SAYNTRA.", "دي صاينترا.")}
            </span>
          </h1>
          <p>
            {t(
              "A little more order. A lot more possibility. Give every repair the workspace it deserves.",
              "كل تفصيلة في مكانها. وكل طلب صيانة له رحلته. خلّي شغلك مترابط وواضح.",
            )}
          </p>
          <HeroDevice
            className="hero-device auth-device"
            fallback={<ProductPreview compact />}
          />
        </div>
        <div className="auth-brand-footer">
          <LockKeyhole size={15} />
          {t("Your business. Your workspace.", "شغلك. ومساحة عملك.")}
        </div>
      </aside>
      <section className="auth-form-side">
        <div className="auth-topbar">
          <Link href="/" className="row">
            <ArrowLeft size={16} className="directional" />
            {t("Back to home", "الرئيسية")}
          </Link>
          <Preferences />
        </div>
        {/* Phones hide the brand panel; keep the identity above the form. */}
        <div className="auth-mobile-brand" aria-hidden="true">
          <span className="auth-mobile-glow" />
          <strong>SAYNTRA</strong>
          <small>{t("Smarter repairs. Better business.", "صيانة أذكى. أعمال أفضل.")}</small>
        </div>
        <motion.div
          className="auth-form-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="auth-form-icon">
            {mode.includes("password") ? (
              <Mail size={26} />
            ) : (
              <LockKeyhole size={26} />
            )}
          </div>
          <h2>{titles[mode][0]}</h2>
          <p>{titles[mode][1]}</p>
          <form className="stack" onSubmit={handleSubmit(submit)} noValidate>
            {mode === "register" && (
              <div className="form-grid">
                {input("name", t("Full name", "الاسم بالكامل"), "text", "name")}
                {input(
                  "organization_name",
                  t("Repair center name", "اسم مركز الصيانة"),
                  "text",
                  "organization",
                )}
              </div>
            )}
            {input(
              "email",
              t("Email address", "البريد الإلكتروني"),
              "email",
              "email",
            )}
            {mode !== "forgot-password" && (
              <div className="field">
                <label htmlFor="password">{t("Password", "كلمة المرور")}</label>
                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    aria-describedby="password-help"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? t("Hide password", "إخفاء كلمة المرور")
                        : t("Show password", "إظهار كلمة المرور")
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <small
                  id="password-help"
                  className={errors.password ? "field-error" : ""}
                >
                  {errors.password?.message ||
                    (mode !== "login"
                      ? t(
                          "12+ characters, uppercase, lowercase and a number.",
                          "12 حرفًا على الأقل، حروف إنجليزية كبيرة وصغيرة ورقم.",
                        )
                      : "")}
                </small>
              </div>
            )}
            {["register", "reset-password"].includes(mode) &&
              input(
                "password_confirmation",
                t("Confirm password", "تأكيد كلمة المرور"),
                "password",
                "new-password",
              )}
            {mode === "register" && (
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="category">
                    {t("Business category", "نوع النشاط")}
                  </label>
                  <select id="category" {...register("category")}>
                    {[
                      ["general", "General repair", "صيانة عامة"],
                      ["mobile", "Mobile phones", "موبايلات"],
                      ["computer", "Computers", "كمبيوتر"],
                      ["electronics", "Electronics", "إلكترونيات"],
                      ["appliance", "Appliances", "أجهزة منزلية"],
                    ].map(([value, en, ar]) => (
                      <option value={value} key={value}>
                        {t(en, ar)}
                      </option>
                    ))}
                  </select>
                </div>
                {input(
                  "phone",
                  t("Business phone (optional)", "هاتف المركز (اختياري)"),
                  "tel",
                  "tel",
                )}
              </div>
            )}
            {mode === "login" && (
              <div className="row between">
                <label className="row">
                  <input type="checkbox" {...register("remember")} />
                  <span>{t("Remember me", "تذكرني")}</span>
                </label>
                <Link href="/forgot-password" className="text-link">
                  {t("Forgot password?", "نسيت كلمة المرور؟")}
                </Link>
              </div>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="success" role="status">
                {success}
              </div>
            )}
            <button
              className="button auth-submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  {t("Connecting securely…", "جارٍ الاتصال الآمن…")}
                </>
              ) : success && mode === "login" ? (
                <CheckCircle2 size={18} />
              ) : (
                <>
                  {mode === "login"
                    ? t("Sign in to your workspace", "ادخل مساحة عملك")
                    : mode === "register"
                      ? t("Create my workspace", "أنشئ مساحة عملي")
                      : mode === "forgot-password"
                        ? t("Send reset link", "إرسال رابط الاستعادة")
                        : t("Update password", "تحديث كلمة المرور")}
                  <ArrowRight size={18} className="directional" />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login"
              ? t("New to SAYNTRA?", "أول مرة تستخدم صاينترا؟")
              : t("Already have an account?", "عندك حساب بالفعل؟")}{" "}
            <Link
              className="text-link"
              href={mode === "login" ? "/register" : "/login"}
            >
              {mode === "login"
                ? t("Create an account", "أنشئ حساب")
                : t("Sign in", "تسجيل الدخول")}
            </Link>
          </p>
          {mode === "register" && (
            <p className="legal-note">
              {t(
                "By creating a workspace, you agree to the",
                "بإنشاء مساحة عمل، فإنك توافق على",
              )}{" "}
              <Link href="/terms">{t("terms", "الشروط")}</Link> {t("and", "و")}{" "}
              <Link href="/privacy">
                {t("privacy notice", "إشعار الخصوصية")}
              </Link>
              .
            </p>
          )}
        </motion.div>
        <div className="auth-footnote">
          © {new Date().getFullYear()} SAYNTRA{" "}
          <bdi>{t("Smarter Repairs. Better Business.", "صيانة أذكى. أعمال أفضل.")}</bdi>
        </div>
      </section>
    </main>
  );
}
