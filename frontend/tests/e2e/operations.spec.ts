import { test, expect } from "@playwright/test";
test("customer, device, assignment and diagnosis persist in MySQL", async ({
  page,
}) => {
  test.setTimeout(120_000);
  test.skip(!process.env.E2E_OWNER_PASSWORD, "Set a local seed password.");
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@sayntra.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.E2E_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL("/app");
  const suffix = String(Date.now()).slice(-10);
  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await expect(page).toHaveURL("/app/customers");
  await expect(
    page.getByRole("heading", { name: "Customers", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add new" }).click();
  await page.getByLabel("Full name").fill("Browser Customer " + suffix);
  await page.getByLabel("Phone", { exact: true }).fill("01" + suffix);
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browser Customer " + suffix }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Devices", exact: true }).click();
  await expect(page).toHaveURL("/app/devices");
  await expect(
    page.getByRole("heading", { name: "Devices", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add new" }).click();
  await page
    .getByLabel("Customer", { exact: true })
    .selectOption({ label: "Browser Customer " + suffix + " · 01" + suffix });
  await page.getByLabel("Category").selectOption("computer");
  await page.getByLabel("Brand", { exact: true }).fill("Lenovo");
  await page.getByLabel("Model", { exact: true }).fill("E2E " + suffix);
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("link", { name: /Repair orders/ }).click();
  await expect(page).toHaveURL("/app/repairs");
  await expect(
    page.getByRole("heading", { name: "Repair orders", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add new" }).click();
  await page.getByLabel("Device", { exact: true }).selectOption({
    label: "Lenovo E2E " + suffix + " · Browser Customer " + suffix,
  });
  await page.getByLabel("Reported problem").fill("No display output");
  await page.getByLabel("Device condition at intake").fill("Light scratches");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page).toHaveURL(/app\/repairs\/\d+/);
  await expect(
    page.getByText("No display output", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Assign technician", exact: true })
    .click();
  await page
    .getByLabel("Technician", { exact: true })
    .selectOption({ label: "Demo Technician" });
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Record diagnosis", exact: true })
    .click();
  await page.getByLabel("Findings").fill("Screen connection fault");
  await page.getByLabel("Recommended work").fill("Replace the connector");
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Screen connection fault", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await page.getByRole("button", { name: /^المظهر/ }).click();
  await page.getByRole("option", { name: "داكن" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.screenshot({
    path: "test-results/repair-ar-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});
