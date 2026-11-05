import { test, expect } from "@playwright/test";
test("marketing hydrates and language/theme preferences persist", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("button", { name: /^المظهر/ }).click();
  await page.getByRole("option", { name: "داكن" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
for (const width of [390, 768, 1440])
  test(`landing and authentication fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.goto("/login");
    await expect(page.getByLabel("Email address")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
test("reduced motion keeps content visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  await expect(page.locator(".mesh-blue").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
test("registration creates a real organization and asks for verification", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("E2E Owner");
  await page.getByLabel("Repair center name").fill("E2E Repair Lab");
  await page.getByLabel("Email address").fill(`e2e-${Date.now()}@example.test`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("E2eSecurePassword123!");
  await page.getByLabel("Confirm password").fill("E2eSecurePassword123!");
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/v1/auth/register"),
  );
  await page.getByRole("button", { name: "Create my workspace" }).click();
  expect((await response).status()).toBe(201);
  await expect(page).toHaveURL(/verify-email/);
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible();
});
test("real session login reaches the protected workspace and logs out", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_OWNER_PASSWORD,
    "Set a locally seeded E2E owner password.",
  );
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@sayntra.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.E2E_OWNER_PASSWORD!);
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/v1/auth/login"),
  );
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  expect((await response).status()).toBe(200);
  await expect(page).toHaveURL("/app");
  await expect(page.locator(".workspace-shell")).toBeVisible();
  await page.getByRole("button", { name: /Sign out/ }).click();
  await expect(page).toHaveURL("/login");
});
