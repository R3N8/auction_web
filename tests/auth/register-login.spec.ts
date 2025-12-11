import { test, expect } from "@playwright/test";

test("register - login flow", async ({ page }) => {
  const email = `test${Date.now()}.user@stud.noroff.no`;
  const pass = "Password123";

  // Register
  await page.goto("#/register");
  await page.fill("#register-name", "TestUser");
  await page.fill("#register-email", email);
  await page.fill("#register-password", pass);
  await page.click("button[type='submit']");

  // Login
  await page.goto("#/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", pass);
  await page.click("button[type='submit']");
  await page.waitForURL(/#\//);

  await expect(page).toHaveURL(/#\//);
});
