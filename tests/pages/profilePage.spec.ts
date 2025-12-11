import { test, expect } from "@playwright/test";

test.describe("Profile Page", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/#/profile");

    // Page should render *something*
    await expect(page).toHaveURL(/profile/);
  });
});
