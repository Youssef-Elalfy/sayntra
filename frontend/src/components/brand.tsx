"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Globe2, Sun, Moon, Monitor, ChevronDown, Check } from "lucide-react";
import { usePreferences, type Theme } from "./providers";
export function Logo({ iconOnly = false }: { iconOnly?: boolean }) {
  const gradient = useId();
  return (
    <Link href="/" className="logo" aria-label="SAYNTRA home">
      <svg aria-hidden="true" viewBox="0 0 48 48">
        <defs>
          <linearGradient id={gradient} x2="1" y2="1">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="15" fill={`url(#${gradient})`} />
        <path
          d="M34 13H19a6 6 0 0 0 0 12h10a5 5 0 0 1 0 10H14"
          fill="none"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="34" cy="13" r="3.5" fill="#A7F3D0" />
        <circle cx="14" cy="35" r="3.5" fill="#A7F3D0" />
      </svg>
      {!iconOnly && (
        <span>
          SAYNTRA<span className="logo-dot">.</span>
        </span>
      )}
    </Link>
  );
}
export function Preferences() {
  const { language, setLanguage, t } = usePreferences();
  return (
    <div className="preferences">
      <button
        type="button"
        className="icon-button language"
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        aria-label={t("Switch to Arabic", "Switch to English")}
      >
        <Globe2 size={16} aria-hidden="true" />
        <span lang={language === "en" ? "ar" : "en"}>
          {language === "en" ? "العربية" : "English"}
        </span>
      </button>
      <ThemeMenu />
    </div>
  );
}

const themeOptions: ReadonlyArray<{
  value: Theme;
  label: readonly [string, string];
  Icon: typeof Sun;
}> = [
  { value: "light", label: ["Light", "فاتح"], Icon: Sun },
  { value: "dark", label: ["Dark", "داكن"], Icon: Moon },
  { value: "system", label: ["System", "حسب النظام"], Icon: Monitor },
];

/**
 * Select-only combobox (WAI-ARIA APG pattern) for the colour theme.
 * A native <select> was replaced because Chrome on Windows paints its option
 * popup with the select's own (transparent) background, which made options
 * unreadable in dark mode.
 */
export function ThemeMenu() {
  const { theme, setTheme, t } = usePreferences();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const selectedIndex = Math.max(
    0,
    themeOptions.findIndex((o) => o.value === theme),
  );
  const current = themeOptions[selectedIndex];
  const label = t("Color theme", "المظهر");

  const show = (index: number) => {
    setActive(index);
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const choose = (index: number) => {
    setTheme(themeOptions[index].value);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onButtonKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show(
        e.key === "ArrowUp"
          ? (selectedIndex + themeOptions.length - 1) % themeOptions.length
          : selectedIndex,
      );
    }
  };
  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const last = themeOptions.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i === last ? 0 : i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i === 0 ? last : i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const CurrentIcon = current.Icon;
  return (
    <div className="theme-menu" ref={root}>
      <button
        ref={button}
        type="button"
        className="icon-button theme-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${t(current.label[0], current.label[1])}`}
        onClick={() => (open ? close(false) : show(selectedIndex))}
        onKeyDown={onButtonKey}
      >
        <CurrentIcon size={16} aria-hidden="true" />
        <span className="theme-trigger-label">
          {t(current.label[0], current.label[1])}
        </span>
        <ChevronDown size={14} aria-hidden="true" className="theme-chevron" />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-opt-${active}`}
          className="theme-menu-list"
          onKeyDown={onListKey}
        >
          {themeOptions.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              className={`theme-menu-option${i === active ? " is-active" : ""}`}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <o.Icon size={16} aria-hidden="true" />
              <span>{t(o.label[0], o.label[1])}</span>
              {i === selectedIndex && (
                <Check size={15} aria-hidden="true" className="theme-check" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function LivingNetwork() {
  return (
    <div className="living-network" aria-hidden="true">
      <div className="mesh mesh-blue" />
      <div className="mesh mesh-teal" />
      <div className="mesh mesh-purple" />
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <path d="M-100 450C150 450 160 120 420 250S780 600 1300 160M-80 530C180 550 300 170 560 300S850 520 1300 300M70 -50C200 180 800 70 950 350S1100 750 1400 650" />
        <g>
          <circle cx="420" cy="250" r="5" />
          <circle cx="950" cy="350" r="5" />
          <circle cx="560" cy="300" r="4" />
        </g>
      </svg>
      <div className="network-grid" />
    </div>
  );
}
