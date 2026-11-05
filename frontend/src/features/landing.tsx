"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Menu,
  X,
  Wrench,
  Package,
  Users,
  ShieldCheck,
  Activity,
  Laptop,
  Smartphone,
  Monitor,
  Refrigerator,
  CircleCheck,
  LayoutDashboard,
  ChevronRight,
  Globe2,
  Layers3,
} from "lucide-react";
import { Logo, Preferences, LivingNetwork } from "@/components/brand";
import { usePreferences } from "@/components/providers";
import { HeroDevice, RepairStory } from "./repair-story";
import { AmbientBackdrop } from "./ambient";
const sections = [
  ["features", "Features", "المميزات"],
  ["how-it-works", "How it works", "كيف تعمل"],
  ["solutions", "Solutions", "الحلول"],
  ["pricing", "Pricing", "الباقات"],
  ["faq", "FAQ", "الأسئلة الشائعة"],
];
export function ProductPreview({ compact = false }: { compact?: boolean }) {
  const { t } = usePreferences();
  return (
    <div className={`product-preview ${compact ? "compact" : ""}`}>
      <div className="preview-toolbar">
        <span className="traffic">
          <i />
          <i />
          <i />
        </span>
        <span>sayntra / workspace</span>
        <span className="preview-label">
          {t("Illustrative preview", "عرض توضيحي")}
        </span>
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar">
          <Logo iconOnly />
          {[LayoutDashboard, Wrench, Users, Package, Activity].map(
            (Icon, i) => (
              <span key={i} className={i === 0 ? "active" : ""}>
                <Icon size={18} />
              </span>
            ),
          )}
        </aside>
        <div className="preview-content">
          <div className="row between">
            <div>
              <span className="mini-kicker">
                {t("YOUR WORKSPACE, CONNECTED", "مساحة عملك، مترابطة")}
              </span>
              <h3>
                {t("A clear view of every repair.", "كل طلب صيانة، قدام عينك.")}
              </h3>
            </div>
            <span className="avatar">S</span>
          </div>
          <div className="preview-kpis">
            {[
              ["24", "Active repairs", "طلبات نشطة"],
              ["08", "Ready for pickup", "جاهزة للاستلام"],
              ["96%", "Approval rate", "نسبة الموافقة"],
            ].map((x, i) => (
              <div key={x[0]}>
                <span className={`mini-icon tone-${i}`}>
                  {i === 0 ? (
                    <Wrench size={16} />
                  ) : i === 1 ? (
                    <CircleCheck size={16} />
                  ) : (
                    <Activity size={16} />
                  )}
                </span>
                <small>{t(x[1], x[2])}</small>
                <strong>{x[0]}</strong>
                <span className="mini-bar">
                  <i style={{ width: `${50 + i * 20}%` }} />
                </span>
              </div>
            ))}
          </div>
          <div className="preview-chart">
            <div className="row between">
              <strong>{t("Repair activity", "نشاط الصيانة")}</strong>
              <span className="muted">{t("This week", "هذا الأسبوع")}</span>
            </div>
            <svg viewBox="0 0 500 110" aria-hidden="true">
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#3B82F6" stopOpacity=".2" />
                  <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 92Q35 100 65 70T130 65T195 38T260 50T325 25T390 35T455 10L500 18V110H0Z"
                fill="url(#chartFill)"
              />
              <path
                d="M0 92Q35 100 65 70T130 65T195 38T260 50T325 25T390 35T455 10L500 18"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
              />
              <path
                d="M0 100Q60 75 100 87T200 70T300 70T400 50T500 42"
                fill="none"
                stroke="#14B8A6"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
            </svg>
          </div>
          <div className="preview-repair">
            <div className="device-icon">
              <Laptop size={21} />
            </div>
            <div>
              <strong>MacBook Pro 14”</strong>
              <small>
                #SYN-0048 · {t("Screen replacement", "استبدال الشاشة")}
              </small>
            </div>
            <span className="badge">{t("Quality check", "فحص الجودة")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function RepairTimelinePreview() {
  const { t } = usePreferences();
  const steps: ReadonlyArray<
    readonly [string, string, "done" | "current" | "next"]
  > = [
    ["Received", "تم الاستلام", "done"],
    ["Diagnosing", "قيد الفحص", "current"],
    ["Awaiting approval", "بانتظار الموافقة", "next"],
    ["Ready for pickup", "جاهز للاستلام", "next"],
  ];
  return (
    <div
      className="spotlight-ui"
      aria-label={t("Sample repair record", "مثال لسجل صيانة")}
    >
      <div className="spotlight-head">
        <div>
          <small>SYN-0048 · {t("Sample", "مثال")}</small>
          <strong>
            {t("Laptop · Screen replacement", "لابتوب · استبدال الشاشة")}
          </strong>
        </div>
        <span className="status-pill">{t("Diagnosing", "قيد الفحص")}</span>
      </div>
      <ol className="spotlight-steps">
        {steps.map(([en, ar, state]) => (
          <li key={en} data-state={state}>
            <span className="spotlight-dot" aria-hidden="true">
              {state === "done" && <Check size={12} />}
            </span>
            {t(en, ar)}
          </li>
        ))}
      </ol>
    </div>
  );
}
export default function Landing() {
  const { t } = usePreferences();
  const [menu, setMenu] = useState(false);
  const [step, setStep] = useState(0);
  const stages = [
    [
      "Receive",
      "الاستلام",
      "Register the customer, device and its condition.",
      "سجّل العميل والجهاز وحالته عند الاستلام.",
    ],
    [
      "Diagnose",
      "التشخيص",
      "Give technicians a clear assignment and record the findings.",
      "وزّع المهام وسجّل تشخيص الفني بوضوح.",
    ],
    [
      "Approve",
      "الموافقة",
      "Prepare an estimate and record the customer’s decision.",
      "جهّز عرض التكلفة وسجّل قرار العميل.",
    ],
    [
      "Repair",
      "الصيانة",
      "Connect the work, parts and stock movements.",
      "اربط أعمال الصيانة بالقطع وحركة المخزون.",
    ],
    [
      "Inspect",
      "الفحص",
      "Check the completed repair before collection.",
      "راجع جودة الإصلاح قبل تسليم الجهاز.",
    ],
    [
      "Deliver",
      "التسليم",
      "Record payment, handover and eligible warranty.",
      "سجّل الدفع والتسليم والضمان المستحق.",
    ],
  ];
  const benefits = [
    [
      Wrench,
      "Every repair, in order.",
      "كل طلب في مكانه.",
      "One connected record for intake, assignment and diagnosis.",
      "سجل واحد مترابط للاستلام والإسناد والفحص.",
    ],
    [
      Package,
      "Parts you can count on.",
      "مخزون تقدر تعتمد عليه.",
      "Planned: connect spare parts to repairs with traceable stock movements.",
      "قيد التطوير: ربط قطع الغيار بالطلبات وتتبع حركات المخزون.",
    ],
    [
      Users,
      "A team in sync.",
      "فريق على نفس الصفحة.",
      "Clear assignments and role-based access keep everyone focused.",
      "مهام واضحة وصلاحيات مناسبة لكل فرد في الفريق.",
    ],
    [
      Activity,
      "Know your business.",
      "افهم أداء مركزك.",
      "See repair progress and customer counts from real business activity.",
      "تابع تقدم الصيانة وأعداد العملاء من بيانات نشاطك الفعلية.",
    ],
    [
      ShieldCheck,
      "Trust, built in.",
      "الثقة في كل خطوة.",
      "Organization isolation, role permissions and recorded repair history.",
      "عزل بيانات المؤسسات وصلاحيات محددة وسجل لطلبات الصيانة.",
    ],
    [
      Globe2,
      "Naturally bilingual.",
      "عربي وإنجليزي بطبيعتها.",
      "A complete workspace in Arabic or English, light or dark.",
      "مساحة عمل بالعربي والإنجليزي، وبمظهر فاتح أو داكن.",
    ],
  ] as const;
  return (
    <>
      <AmbientBackdrop />
      <header className="marketing-header">
        <div className="marketing-nav">
          <Logo />
          <nav
            aria-label={t("Main navigation", "التنقل الرئيسي")}
            className={menu ? "open" : ""}
          >
            {sections.map(([id, en, ar]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                {t(en, ar)}
              </a>
            ))}
            <div className="mobile-nav-actions">
              <Link className="button secondary" href="/login">
                {t("Log in", "دخول")}
              </Link>
              <Link className="button" href="/register">
                {t("Get started", "ابدأ الآن")}
              </Link>
            </div>
          </nav>
          <div className="row nav-actions">
            <Preferences />
            <Link className="login-link" href="/login">
              {t("Log in", "دخول")}
            </Link>
            <Link className="button small" href="/register">
              {t("Get started", "ابدأ الآن")}
              <ArrowUpRight size={16} />
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-label={t("Toggle navigation", "فتح القائمة")}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <LivingNetwork />
          <div className="hero-inner">
            <motion.div
              className="hero-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="hero-eyebrow">
                <span className="status-dot" />
                {t(
                  "A NEW RHYTHM FOR REPAIR BUSINESSES",
                  "إيقاع جديد لإدارة مراكز الصيانة",
                )}
              </div>
              <h1>
                {t(
                  "The smarter way to run your repair center.",
                  "إدارة مركز الصيانة أصبحت أذكى.",
                )}
              </h1>
              <p className="hero-description">
                {t(
                  "Bring customers, devices, repair intake and technicians together in one connected workspace.",
                  "نظّم العملاء والأجهزة واستلام طلبات الصيانة ومهام الفنيين من مساحة عمل واحدة.",
                )}
              </p>
              <div className="hero-actions">
                <Link className="button" href="/register">
                  {t("Build your workspace", "ابدأ مساحة عملك")}
                  <ArrowRight className="directional" size={17} />
                </Link>
                <a href="#features" className="button secondary">
                  {t("Explore features", "اكتشف المميزات")}
                </a>
              </div>
              <p className="muted hero-note">
                {t(
                  "Development release · Inventory, billing and customer tracking are coming later.",
                  "نسخة تطوير · المخزون والفواتير وتتبع العميل متاحة في مراحل لاحقة.",
                )}
              </p>
              <div className="hero-promises">
                <span>
                  <Check size={15} />
                  {t("Built for your workflow", "مصممة لطريقة شغلك")}
                </span>
                <span>
                  <Check size={15} />
                  {t("Arabic & English", "عربي وإنجليزي")}
                </span>
              </div>
            </motion.div>
            <motion.div
              className="hero-visual"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
            >
              <div className="floating-chip chip-top">
                <span className="chip-icon">
                  <CircleCheck size={21} />
                </span>
                <div>
                  <strong>
                    {t("Every detail. Connected.", "كل التفاصيل، مترابطة.")}
                  </strong>
                  <small>
                    {t("From intake to diagnosis", "من الاستلام للفحص")}
                  </small>
                </div>
              </div>
              <HeroDevice fallback={<ProductPreview />} />
              <div className="floating-chip chip-bottom">
                <span className="chip-icon purple">
                  <Layers3 size={20} />
                </span>
                <div>
                  <strong>
                    {t(
                      "Less juggling. More clarity.",
                      "تنظيم أكتر. مجهود أقل.",
                    )}
                  </strong>
                  <small>
                    {t(
                      "Your entire operation, in one place",
                      "كل عمليات مركزك في مكان واحد",
                    )}
                  </small>
                </div>
              </div>
              <span className="orbital orbital-one" />
              <span className="orbital orbital-two" />
            </motion.div>
          </div>
          <div className="business-strip">
            <span>
              {t("BUILT FOR THE WAY YOU REPAIR", "لكل أنواع الصيانة")}
            </span>
            {[
              [Smartphone, "Mobile", "الموبايلات"],
              [Laptop, "Computers", "الكمبيوتر"],
              [Monitor, "Electronics", "الإلكترونيات"],
              [Refrigerator, "Appliances", "الأجهزة المنزلية"],
            ].map(([Icon, en, ar]) => {
              const I = Icon as typeof Laptop;
              return (
                <span key={en as string}>
                  <I size={19} />
                  {t(en as string, ar as string)}
                </span>
              );
            })}
          </div>
        </section>
        <section className="marketing-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">
              {t("LESS FRICTION. MORE FOCUS.", "مجهود أقل. تركيز أكبر.")}
            </span>
            <h2>
              {t("Your whole operation.", "كل شغلك.")}
              <br />
              <span className="muted">
                {t("Finally working together.", "أخيرًا، في نظام واحد.")}
              </span>
            </h2>
            <p>
              {t(
                "A busy repair center has enough moving parts. Your software should bring them together.",
                "مركز الصيانة فيه تفاصيل كتير. منصتك لازم تجمعها وتسهّل إدارتها.",
              )}
            </p>
          </div>
          <div className="benefit-grid">
            {benefits.map(([Icon, en, ar, body, bodyAr], i) => (
              <article
                className={`benefit${i === 0 ? " benefit-spotlight" : ""}`}
                key={en}
                data-tilt={i === 0 ? "4" : "7"}
              >
                <span className={`feature-icon tone-${i % 3}`}>
                  <Icon size={23} />
                </span>
                <h3>{t(en, ar)}</h3>
                <p>{t(body, bodyAr)}</p>
                {i === 0 && <RepairTimelinePreview />}
                <span className="feature-line" />
              </article>
            ))}
          </div>
        </section>
        <section className="workflow-section" id="how-it-works">
          <div className="marketing-section">
            <div className="section-heading centered">
              <span className="eyebrow">
                {t(
                  "FROM FIRST HELLO TO FINAL HANDOVER",
                  "من أول استقبال لآخر خطوة",
                )}
              </span>
              <h2>
                {t(
                  "A smoother path for every repair.",
                  "رحلة أوضح لكل طلب صيانة.",
                )}
              </h2>
              <p>
                {t(
                  "Our six-stage product roadmap. Intake and diagnosis are available; approval, stock, finance and delivery are still in development.",
                  "خريطة تطوير من ست مراحل. الاستلام والفحص متاحان؛ الموافقات والمخزون والحسابات والتسليم قيد التطوير.",
                )}
              </p>
            </div>
            <div
              className="workflow-tabs"
              role="tablist"
              aria-label={t("Repair workflow", "مراحل الصيانة")}
            >
              {stages.map((s, i) => (
                <button
                  key={s[0]}
                  role="tab"
                  aria-selected={step === i}
                  aria-controls="stage-panel"
                  id={`stage-${i}`}
                  onClick={() => setStep(i)}
                  className={step === i ? "active" : ""}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {t(s[0], s[1])}
                </button>
              ))}
            </div>
            <div
              className="workflow-panel"
              data-tilt="3"
              id="stage-panel"
              role="tabpanel"
              aria-labelledby={`stage-${step}`}
            >
              <div className="workflow-symbol">
                <Wrench size={44} />
                <span>{step + 1}</span>
              </div>
              <div>
                <span className="eyebrow">SAYNTRA WORKFLOW / 0{step + 1}</span>
                <h3>{t(stages[step][0], stages[step][1])}</h3>
                <p>{t(stages[step][2], stages[step][3])}</p>
              </div>
              <Link className="button secondary" href="/register">
                {t("Make it your workflow", "ابدأ رحلتك")}
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
        <RepairStory />
        <section className="marketing-section showcase" id="solutions">
          <div>
            <span className="eyebrow">
              {t(
                "THE BIG PICTURE, WITHOUT THE CLUTTER",
                "الصورة كاملة، بدون تعقيد",
              )}
            </span>
            <h2>
              {t("Made for the work", "مصممة للشغل")}
              <br />
              {t("that keeps you busy.", "اللي بيملأ يومك.")}
            </h2>
            <p>
              {t(
                "From a neighborhood laptop specialist to an electronics service team, SAYNTRA organizes the details so you can focus on the repair.",
                "من محل صيانة لابتوب لفريق صيانة إلكترونيات، صاينترا بتنظم التفاصيل عشان تركز في شغلك.",
              )}
            </p>
            <ul className="check-list">
              {[
                [
                  "Clear records for customers and devices",
                  "سجلات واضحة للعملاء والأجهزة",
                ],
                [
                  "Planned: estimates, invoices and recorded payments",
                  "قيد التطوير: عروض التكلفة والفواتير والمدفوعات",
                ],
                ["Separate access for every role", "صلاحيات مناسبة لكل دور"],
                [
                  "A thoughtful light and dark experience",
                  "مظهر فاتح وداكن مريح للعين",
                ],
              ].map(([en, ar]) => (
                <li key={en}>
                  <Check size={17} />
                  {t(en, ar)}
                </li>
              ))}
            </ul>
          </div>
          <div className="showcase-preview">
            <ProductPreview compact />
          </div>
        </section>
        <section className="marketing-section" id="pricing">
          <div className="section-heading centered">
            <span className="eyebrow">{t("ROOM TO GROW", "مساحة للتوسع")}</span>
            <h2>
              {t(
                "Start organized. Stay connected.",
                "ابدأ منظم. وكبّر شغلك بثقة.",
              )}
            </h2>
            <p>
              {t(
                "Subscription packages are being prepared. No paid billing is active in this release.",
                "باقات الاشتراك قيد التجهيز. الدفع للاشتراكات غير مفعّل في الإصدار الحالي.",
              )}
            </p>
          </div>
          <div className="access-panel" data-tilt="3">
            <div className="access-copy">
              <span className="badge">{t("Early access", "وصول مبكر")}</span>
              <h3>
                {t(
                  "Use what is ready today, at no cost.",
                  "استخدم المتاح الآن بدون تكلفة.",
                )}
              </h3>
              <p>
                {t(
                  "SAYNTRA is in development. Create a workspace to manage customers, devices, intake and diagnosis now. Pricing will be announced before any billing starts, and no payment details are requested.",
                  "صاينترا قيد التطوير. أنشئ مساحة عمل لإدارة العملاء والأجهزة والاستلام والتشخيص الآن. سيتم الإعلان عن الأسعار قبل بدء أي فوترة، ولا نطلب أي بيانات دفع.",
                )}
              </p>
              <Link href="/register" className="button">
                {t("Create a workspace", "أنشئ مساحة عمل")}
                <ArrowRight className="directional" size={17} />
              </Link>
            </div>
            <ul
              className="access-plans"
              aria-label={t("Planned packages", "الباقات المخطط لها")}
            >
              {[
                [
                  "Starter",
                  "البداية",
                  "A single repair counter getting organised.",
                  "لمركز صيانة واحد يبدأ التنظيم.",
                ],
                [
                  "Professional",
                  "الاحترافية",
                  "Growing teams with several technicians.",
                  "لفريق يتوسع بعدة فنيين.",
                ],
                [
                  "Business",
                  "الأعمال",
                  "Busier centres that need deeper reporting.",
                  "للمراكز الأكبر التي تحتاج تقارير أعمق.",
                ],
              ].map(([en, ar, desc, descAr]) => (
                <li key={en}>
                  <strong>{t(en, ar)}</strong>
                  <span>{t(desc, descAr)}</span>
                  <small>{t("Planned", "مخطط لها")}</small>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="marketing-section faq-section" id="faq">
          <div>
            <span className="eyebrow">
              {t("A LITTLE MORE CLARITY", "إجابات أوضح")}
            </span>
            <h2>
              {t("Good questions.", "أسئلتك مهمة.")}
              <br />
              {t("Clear answers.", "وإجاباتنا واضحة.")}
            </h2>
          </div>
          <div className="faq-list">
            {[
              [
                "Is SAYNTRA just for phone repairs?",
                "هل صاينترا لصيانة الموبايلات فقط؟",
                "No. The workflow accommodates computers, electronics, appliances and general technical services.",
                "لا، تدعم صيانة الكمبيوتر والإلكترونيات والأجهزة المنزلية والخدمات الفنية.",
              ],
              [
                "Does it support Arabic?",
                "هل المنصة تدعم العربية؟",
                "Yes. Arabic uses a right-to-left layout with Tajawal typography. You can switch to English at any time.",
                "نعم، بواجهة كاملة من اليمين لليسار وخط Tajawal، مع التبديل للإنجليزية.",
              ],
              [
                "Can my team have separate access?",
                "هل لكل فرد صلاحيات مختلفة؟",
                "Owners, managers, receptionists and technicians have role-based access. Inventory and finance modules are planned.",
                "صلاحيات محددة للمالك والمدير والاستقبال والفني. وحدات المخزون والحسابات قيد التطوير.",
              ],
              [
                "Does SAYNTRA process card payments?",
                "هل صاينترا بتحصّل مدفوعات الكروت؟",
                "Payment recording is planned and is not available in this checkpoint. SAYNTRA does not process online payments or store card details.",
                "تسجيل المدفوعات قيد التطوير وغير متاح في هذه النسخة. صاينترا لا تعالج الدفع الإلكتروني ولا تخزّن بيانات الكروت.",
              ],
              [
                "How do I get started?",
                "أبدأ إزاي؟",
                "Create an account and business workspace, verify your email, then start adding your customers and repair records.",
                "أنشئ حساب ومساحة عمل، وأكّد بريدك الإلكتروني، ثم أضف عملاءك وطلبات الصيانة.",
              ],
            ].map(([en, ar, body, bodyAr]) => (
              <details key={en}>
                <summary>
                  {t(en, ar)}
                  <ChevronRight size={18} />
                </summary>
                <p>{t(body, bodyAr)}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <LivingNetwork />
          <div>
            <span className="eyebrow">
              SAYNTRA / {t("YOUR NEXT CHAPTER", "بداية جديدة لشغلك")}
            </span>
            <h2>
              {t("Make every repair", "خلّي كل طلب صيانة")}
              <br />
              {t("easier to manage.", "أسهل في إدارته.")}
            </h2>
            <Link href="/register" className="button">
              {t("Get started with SAYNTRA", "ابدأ مع صاينترا")}
              <ArrowRight className="directional" size={18} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="marketing-footer">
        <div>
          <Logo />
          <p>
            {t("Smarter Repairs. Better Business.", "صيانة أذكى. أعمال أفضل.")}
          </p>
        </div>
        <div className="row footer-links">
          <a href="#features">{t("Product", "المنتج")}</a>
          <Link href="/privacy">{t("Privacy", "الخصوصية")}</Link>
          <Link href="/terms">{t("Terms", "الشروط")}</Link>
          <Link href="/login">{t("Log in", "دخول")}</Link>
        </div>
        <small>© {new Date().getFullYear()} SAYNTRA</small>
      </footer>
    </>
  );
}
