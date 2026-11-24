import { test, expect, type Page } from "@playwright/test";

/*
 * Portfolio demo: runs entirely in the browser with fictional data.
 * Works against a local server or the deployed URL (E2E_BASE_URL).
 * Set E2E_DEMO_BUILD=1 when the target was built with NEXT_PUBLIC_DEMO_MODE.
 */

const demoBuild = process.env.E2E_DEMO_BUILD === "1";

/** Records any request that would need the Laravel backend. */
function watchBackend(page: Page) {
  const hits: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith("/api/") || u.pathname.startsWith("/sanctum/") || u.port === "8000")
      hits.push(r.url());
  });
  return hits;
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

async function openDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore live demo" }).first().click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 30_000 });
  await expect(page.getByText("Nile Fix Lab (Demo)").first()).toBeAttached();
  await expect(page.locator(".workspace-content")).toBeVisible();
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "sayntra-language", value: "en", url: test.info().project.use.baseURL || "http://localhost:3000" },
  ]);
});

test("landing navigation works and the live demo opens without sign-up", async ({ page }) => {
  const backend = watchBackend(page);
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  for (const id of ["features", "how-it-works", "solutions", "pricing", "faq"]) {
    await page.locator(`.marketing-nav nav a[href="#${id}"]`).click();
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  await openDemo(page);
  // Dashboard figures agree with the sample data set.
  await expect(page.locator(".kpi").first()).toContainText("24");
  await expect(page.getByText("Portfolio demo").first()).toBeVisible();
  expect(backend, "demo browsing must not call the Laravel API").toEqual([]);
  expect(errors).toEqual([]);
});

test("repairs: search, filter, details and a status workflow step", async ({ page }) => {
  const backend = watchBackend(page);
  await openDemo(page);
  await page.getByRole("link", { name: "Repair orders" }).click();
  await expect(page.getByRole("link", { name: "SYN-DEMO-0024" })).toBeVisible();

  await page.getByLabel("Search records").fill("0007");
  await expect(page.locator(".data-table tbody tr")).toHaveCount(1);
  await page.getByLabel("Search records").fill("");
  await page.getByLabel("Filter by status").selectOption("delivered");
  await expect(page.locator(".data-table tbody tr")).toHaveCount(6);
  await page.getByLabel("Filter by status").selectOption("");

  // SYN-DEMO-0001 starts as Received with an allowed next step.
  await page.goto("/app/repairs/1");
  await expect(page.getByRole("heading", { name: "SYN-DEMO-0001" })).toBeVisible();
  await page.getByRole("button", { name: "Awaiting diagnosis" }).click();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.locator(".badge", { hasText: "Awaiting diagnosis" }).first()).toBeVisible();
  await page.reload();
  await expect(page.locator(".repair-timeline")).toContainText("Awaiting diagnosis");
  expect(backend).toEqual([]);
});

test("create a customer, then reset demo data", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("link", { name: "Customers" }).click();
  await page.getByRole("button", { name: "Add new" }).click();
  await page.getByLabel("Full name").fill("Playwright Visitor");
  await page.getByLabel("Phone").fill("+20 10 5555 9999");
  await page.getByRole("button", { name: "Save record" }).click();
  await page.goto("/app/customers");
  await expect(page.getByText("Playwright Visitor")).toBeVisible();

  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByText("Playwright Visitor")).toHaveCount(0);
});

test("profile opens settings; exit demo returns to the landing page", async ({ page }) => {
  await openDemo(page);
  await page.locator(".profile-link").click();
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByText("disabled in this portfolio demo")).toBeVisible();
  await page.getByRole("button", { name: "Exit demo" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("Arabic RTL, dark theme and mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("مختبر النيل للصيانة (تجريبي)").first()).toBeAttached();
  await page.getByRole("button", { name: /^المظهر/ }).click();
  await page.getByRole("option", { name: "داكن" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const path of ["/app", "/app/repairs", "/app/repairs/7", "/app/customers", "/app/settings"]) {
    await page.goto(path);
    await expect(page.locator(".workspace-content")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${path} fits 390px`,
    ).toBe(true);
  }
});

test("account pages on the public build explain the demo", async ({ page }) => {
  test.skip(!demoBuild, "Only the portfolio build replaces account pages.");
  for (const path of ["/login", "/register", "/verify-email", "/forgot-password"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "This is a portfolio demo." })).toBeVisible();
  }
  await page.getByRole("link", { name: "Explore live demo" }).click();
  await expect(page).toHaveURL(/\/app$/);
});
