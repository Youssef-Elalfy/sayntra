import { test, expect, type Page } from "@playwright/test";

async function scrollStory(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const s = document.querySelector<HTMLElement>(".repair-story");
    if (!s) throw new Error("repair story section missing");
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + f * (s.offsetHeight - window.innerHeight) });
  }, fraction);
}

test("3D hero and repair story render without page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-device canvas")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".repair-story.is-sequence")).toBeVisible();

  const stages = page.locator(".story-stages li");
  await expect(stages).toHaveCount(6);
  for (const [fraction, index] of [
    [0.05, 0],
    [0.27, 1],
    [0.45, 2],
    [0.62, 3],
    [0.8, 4],
    [0.96, 5],
  ] as const) {
    await scrollStory(page, fraction);
    await expect(stages.nth(index)).toHaveAttribute("aria-current", "step");
  }
  await expect(page.locator(".story-stage canvas")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("without WebGL the page falls back to 2D content", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    // Simulate a browser or GPU without WebGL support.
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return (original as (...a: unknown[]) => RenderingContext | null).call(
        this,
        type,
        ...rest,
      );
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".hero-visual .product-preview")).toBeVisible();
  await expect(page.locator(".repair-story.is-static")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  // Every stage description is readable when the sequence is unavailable.
  await expect(page.locator(".story-stages li.is-active")).toHaveCount(6);
});

test("reduced motion keeps the repair story readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  await scrollStory(page, 0.62);
  await expect(page.locator(".story-stages li").nth(3)).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(
    page.locator(".story-stages li.is-active p"),
  ).toHaveCSS("opacity", "1");
});
