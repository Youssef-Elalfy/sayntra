import { test, expect, type Page } from "@playwright/test";

/** WCAG relative-luminance contrast between two computed CSS colours. */
async function optionContrast(page: Page) {
  return page.evaluate(() => {
    const parse = (c: string) => {
      const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
      return m.slice(0, 3);
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const list = document.querySelector<HTMLElement>(".theme-menu-list")!;
    const bg = parse(getComputedStyle(list).backgroundColor);
    return [...list.querySelectorAll<HTMLElement>("[role=option]")].map((o) => {
      const fg = parse(getComputedStyle(o).color);
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return { text: o.textContent, ratio: (a + 0.05) / (b + 0.05) };
    });
  });
}

for (const language of ["en", "ar"] as const) {
  for (const theme of ["light", "dark", "system"] as const) {
    test(`theme menu ${language} ${theme}: readable and keyboard operable`, async ({
      page,
    }) => {
      await page.context().addCookies([
        { name: "sayntra-language", value: language, url: "http://localhost:3000" },
        { name: "sayntra-theme", value: theme, url: "http://localhost:3000" },
      ]);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");
      const trigger = page.locator(".marketing-nav .theme-trigger");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      const shot = (state: string) =>
        page.screenshot({
          path: `test-results/theme-menu/${language}-${theme}-${state}.png`,
          clip: { x: language === "ar" ? 0 : 640, y: 0, width: 640, height: 260 },
        });
      await shot("closed");

      // Keyboard: open with ArrowDown, move, close with Escape (focus returns).
      await trigger.focus();
      await page.keyboard.press("ArrowDown");
      const list = page.getByRole("listbox");
      await expect(list).toBeVisible();
      await expect(list).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await shot("keyboard-focus");
      await page.keyboard.press("Escape");
      await expect(list).toBeHidden();
      await expect(trigger).toBeFocused();

      // Every option is legible against the menu surface (WCAG AA 4.5:1).
      await trigger.click();
      for (const o of await optionContrast(page))
        expect(o.ratio, `${o.text} contrast`).toBeGreaterThanOrEqual(4.5);
      const options = page.getByRole("option");
      await expect(options).toHaveCount(3);
      await options.nth(1).hover();
      await shot("hover");
      // The menu stays inside the viewport (no clipping in either direction).
      const box = await list.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(1280);

      // Enter selects the active option and persists it.
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
      await trigger.click();
      await expect(options.nth(2)).toHaveAttribute("aria-selected", "true");
      await shot("selected");
      await options.nth(1).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    });
  }
}

test("theme menu fits and works on a 320px phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.locator(".marketing-nav .theme-trigger").click();
  const box = await page.getByRole("listbox").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.getByRole("option").first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
