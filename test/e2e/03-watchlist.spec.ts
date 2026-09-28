import { test, expect } from "@playwright/test";

test("add and remove a ticker", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("watchlist-row-AAPL")).toBeVisible();

  await page.getByTestId("watchlist-add-input").fill("PYPL");
  await page.getByTestId("watchlist-add-button").click();
  await expect(page.getByTestId("watchlist-row-PYPL")).toBeVisible();

  await page.getByTestId("watchlist-remove-PYPL").click();
  await expect(page.getByTestId("watchlist-row-PYPL")).toHaveCount(0);
});
