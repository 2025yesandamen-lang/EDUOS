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

test("login with invalid credentials displays error message and rejects access", async ({ page }) => {
  await page.goto("/");
  await page.locator("#login-email").fill("unregistered@eduos.com");
  await page.locator("#login-password").fill("wrongpassword");
  await page.getByRole("button", { name: /Sign In to EduOS|Authorize/i }).click();
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
});