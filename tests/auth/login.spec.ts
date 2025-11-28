import { test, expect } from "@playwright/test";

test("login using env variables", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const pass = process.env.TEST_USER_PASSWORD;

  if (!email || !pass) {
    throw new Error(
      "Missing env variables: TEST_USER_EMAIL or TEST_USER_PASSWORD",
    );
  }

  await page.goto("#/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", pass);
  await page.click("button[type='submit']");
  await page.waitForURL(/#\//);

  await expect(page).toHaveURL(/#\//);
});
