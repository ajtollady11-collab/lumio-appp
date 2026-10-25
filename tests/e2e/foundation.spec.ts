import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("holding page", () => {
  test("states plainly that the product is in development", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Lumio");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "finds the step where it went wrong",
    );
    await expect(page.getByText("in development and not open to students yet")).toBeVisible();
    // No sign-up or purchase controls exist before the features behind them do.
    await expect(page.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /sign up|log in|pricing|buy/i })).toHaveCount(0);
  });

  test("shows a worked example with the mistaken step identified for screen readers", async ({
    page,
  }) => {
    await page.goto("/");
    const working = page.getByRole("list", { name: "Working" });
    await expect(working.getByRole("listitem")).toHaveCount(3);
    await expect(working.getByText("(this step contains the mistake)")).toBeAttached();
  });

  test("has no detectable WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("does not scroll horizontally", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("offers a skip link as the first focusable element", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is checked on desktop");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
  });
});

test.describe("platform", () => {
  test("health endpoint reports ok and is never cached", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(["local", "preview", "production"]).toContain(body.environment);
    expect(Object.keys(body).sort()).toEqual(["checkedAt", "commit", "environment", "status"]);
  });

  test("sends baseline security headers", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("unknown pages return 404 with a way back", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to the home page" })).toBeVisible();
  });
});
