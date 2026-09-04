import { expect, test } from "playwright/test";

test("production SPA renders the public EduOS entry screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.getByText(/EduOS|CBT PRO X/i).first()).toBeVisible();
});

test("school landing route renders without a server-side route error", async ({ page }) => {
  const response = await page.goto("/school/default");
  expect(response?.status()).toBe(200);
  await expect(page.locator("#root")).toBeVisible();
});