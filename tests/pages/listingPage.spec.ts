import { test, expect } from "@playwright/test";

test.describe("Listing Page", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/#/listing/1");

    // Page should load the route
    await expect(page).toHaveURL(/listing/);
  });
});
