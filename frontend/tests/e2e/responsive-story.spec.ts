import { test, expect, type Page } from "@playwright/test";

/*
 * Repair-story layout regression: at every viewport, in both directions, the
 * connection labels must sit fully inside the stage and the viewport, and the
 * page must never scroll horizontally. Screenshots land in test-results for
 * visual review.
 */

const viewports = [
  [320, 640],
  [360, 740],
  [375, 812],
  [390, 844],
  [414, 896],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
] as const;

const stages = [0.05, 0.27, 0.45, 0.62, 0.8, 0.96] as const;

async function setPrefs(page: Page, language: "en" | "ar", theme: "light" | "dark") {
  await page.context().addCookies([
    { name: "sayntra-language", value: language, url: "http://localhost:3000" },
    { name: "sayntra-theme", value: theme, url: "http://localhost:3000" },
  ]);
}

async function scrollStory(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const s = document.querySelector<HTMLElement>(".repair-story");
    if (!s) throw new Error("repair story missing");
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + f * (s.offsetHeight - window.innerHeight) });
  }, fraction);
}

for (const language of ["en", "ar"] as const) {
  for (const [width, height] of viewports) {
    test(`story labels fit ${language} ${width}x${height}`, async ({ page }) => {
      await setPrefs(page, language, language === "ar" ? "dark" : "light");
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(page.locator(".story-stage canvas")).toBeAttached({
        timeout: 20_000,
      });
      for (const [i, f] of stages.entries()) {
        await scrollStory(page, f);
        await expect(page.locator(".story-stages li").nth(i)).toHaveAttribute(
          "aria-current",
          "step",
        );
        // Let scroll-coupled easing settle before measuring.
        await page.waitForTimeout(i === 3 ? 1600 : 500);
        const report = await page.evaluate(() => {
          const stage = document.querySelector(".story-canvas")!.getBoundingClientRect();
          const out: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>(".story-node")) {
            const r = el.getBoundingClientRect();
            const name = el.textContent ?? "?";
            if (r.left < -0.5 || r.right > window.innerWidth + 0.5)
              out.push(`${name} outside viewport (${r.left.toFixed(0)}..${r.right.toFixed(0)})`);
            if (
              r.left < stage.left - 0.5 ||
              r.right > stage.right + 0.5 ||
              r.top < stage.top - 0.5 ||
              r.bottom > stage.bottom + 0.5
            )
              out.push(`${name} outside stage`);
          }
          if (document.documentElement.scrollWidth > window.innerWidth)
            out.push(`horizontal overflow ${document.documentElement.scrollWidth}`);
          return out;
        });
        expect(report, `stage ${i + 1}`).toEqual([]);
        if (i === 3 || width === 390 || width === 1440)
          await page.screenshot({
            path: `test-results/story/${language}-${width}-stage${i + 1}.png`,
          });
      }
    });
  }
}
