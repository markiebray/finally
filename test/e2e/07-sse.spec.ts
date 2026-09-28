import { test, expect } from "@playwright/test";

const STREAM = "**/api/stream/prices";

test("reconnects after the price stream drops", async ({ page }) => {
  // Each intercepted stream ends immediately, like a server dropping the connection.
  await page.route(STREAM, (route) =>
    route.fulfill({ status: 200, contentType: "text/event-stream", body: "retry: 500\n\n" }),
  );
  await page.goto("/");
  const status = page.getByTestId("connection-status");
  await expect(status).toHaveAttribute("data-status", "reconnecting");

  await page.unroute(STREAM);
  await expect(status).toHaveAttribute("data-status", "connected");

  const price = page.getByTestId("price-AAPL");
  await expect(price).toHaveText(/\d/);
  const current = await price.textContent();
  await expect(price).not.toHaveText(current!, { timeout: 10_000 });
});
