"use client";
import dynamic from "next/dynamic";
import { useRef, useState, type ReactNode } from "react";
import {
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { usePreferences } from "@/components/providers";
import {
  stageForProgress,
  useRenderTier,
  useWebGLAvailable,
} from "./three/capabilities";
import type { ScreenStage } from "./three/textures";

const HeroScene = dynamic(() => import("./three/hero-scene"), {
  ssr: false,
  loading: () => <div className="device-canvas is-loading" />,
});
const StoryScene = dynamic(() => import("./three/story-scene"), {
  ssr: false,
  loading: () => <div className="device-canvas is-loading" />,
});

/**
 * Hero device. Renders only while on screen; falls back to `fallback`
 * (the 2D interface preview) when WebGL is unavailable.
 */
export function HeroDevice({
  fallback,
  className = "hero-device",
}: {
  fallback: ReactNode;
  className?: string;
}) {
  const { language } = usePreferences();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "120px 0px" });
  const reduced = useReducedMotion() ?? false;
  const webgl = useWebGLAvailable();
  const tier = useRenderTier();
  if (webgl === false) return <>{fallback}</>;
  return (
    <div ref={ref} className={className}>
      {webgl && (
        <HeroScene
          language={language}
          active={inView}
          reducedMotion={reduced}
          tier={tier}
        />
      )}
    </div>
  );
}

const stages: ReadonlyArray<{
  title: readonly [string, string];
  body: readonly [string, string];
  available: boolean;
}> = [
  {
    title: ["Intake", "الاستلام"],
    body: [
      "Record the customer, the device and its condition the moment it arrives.",
      "سجّل العميل والجهاز وحالته لحظة وصوله.",
    ],
    available: true,
  },
  {
    title: ["Diagnosis", "التشخيص"],
    body: [
      "The assigned technician records findings against the device, so nothing depends on memory.",
      "الفني المسؤول يسجّل التشخيص على الجهاز نفسه، فلا شيء يعتمد على الذاكرة.",
    ],
    available: true,
  },
  {
    title: ["Inside the repair", "داخل الجهاز"],
    body: [
      "Break the job down part by part. Estimates and customer approval are in development.",
      "قسّم العمل قطعة بقطعة. عروض التكلفة وموافقة العميل قيد التطوير.",
    ],
    available: false,
  },
  {
    title: ["Connected operations", "عمليات مترابطة"],
    body: [
      "Technician, customer and history connect to one repair record. Spare parts and reports are in development.",
      "الفني والعميل وسجل الطلب مرتبطين بسجل صيانة واحد. قطع الغيار والتقارير قيد التطوير.",
    ],
    available: false,
  },
  {
    title: ["Quality check", "فحص الجودة"],
    body: [
      "Status changes follow the allowed repair workflow, and every change is kept in the history.",
      "تغيير الحالة يتبع مراحل الصيانة المسموحة، وكل تغيير محفوظ في السجل.",
    ],
    available: true,
  },
  {
    title: ["Ready for pickup", "جاهز للاستلام"],
    body: [
      "Mark the device ready for collection. Its full repair history stays with it.",
      "حدّد الجهاز كجاهز للاستلام، ويبقى سجل صيانته الكامل محفوظًا معه.",
    ],
    available: true,
  },
];

export function RepairStory() {
  const { t, language } = usePreferences();
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const webgl = useWebGLAvailable();
  const tier = useRenderTier();
  const inView = useInView(ref, { margin: "100px 0px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [stage, setStage] = useState<ScreenStage>(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = stageForProgress(v);
    setStage((prev) => (prev === next ? prev : next));
  });
  const sequence = webgl !== false;

  return (
    <section
      ref={ref}
      className={`repair-story ${sequence ? "is-sequence" : "is-static"}`}
      id="story"
      aria-labelledby="story-title"
    >
      <div className="story-sticky">
        <div className="story-copy">
          <h2 id="story-title">
            {t("Follow one repair, start to finish.", "تابع طلب صيانة من أوله لآخره.")}
          </h2>
          <ol className="story-stages">
            {stages.map((s, i) => (
              <li
                key={s.title[0]}
                className={!sequence || i === stage ? "is-active" : i < stage ? "is-past" : ""}
                aria-current={sequence && i === stage ? "step" : undefined}
              >
                <span className="story-index" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>
                    {t(s.title[0], s.title[1])}
                    {!s.available && (
                      <span className="story-badge">
                        {t("In development", "قيد التطوير")}
                      </span>
                    )}
                  </h3>
                  <p>
                    <span>{t(s.body[0], s.body[1])}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="story-note">
            {t(
              "Illustrative 3D model with sample data.",
              "نموذج ثلاثي الأبعاد توضيحي ببيانات مثال.",
            )}
          </p>
        </div>
        {sequence && (
          <div className="story-stage">
            {webgl && (
              <StoryScene
                progress={scrollYProgress}
                screenStage={stage}
                language={language}
                active={inView}
                reducedMotion={reduced}
                tier={tier}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
