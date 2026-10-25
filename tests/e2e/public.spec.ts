import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectNoHorizontalScroll } from "./helpers";

test.describe("landing page", () => {
  test("presents the product with working calls to action", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Learn better\. Remember more\./);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Learn better. Remember more.",
    );
    await expect(page.getByRole("link", { name: "Start learning" })).toHaveAttribute(
      "href",
      "/signup",
    );
    await expect(page.getByRole("heading", { name: /Start learning with/ })).toBeVisible();
    // The product preview is an illustration with example content, not live data or controls.
    await expect(page.getByRole("img", { name: /using example content/ })).toBeVisible();
    await expect(page.getByText("Example content, for illustration.")).toBeVisible();
    await expect(page.locator("meta[property='og:title']")).toHaveAttribute(
      "content",
      /Learn better/,
    );
  });

  test("has no testimonials, pricing or invented statistics", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("main").innerText()).toLowerCase();
    for (const banned of ["testimonial", "pricing", "£", "$", "% of students", "trusted by"]) {
      expect(text).not.toContain(banned);
    }
  });

  test("navigation links reach their sections and pages", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: "How it works" }).first().click();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect(
      page.getByRole("heading", { name: "Three steps to a better routine." }),
    ).toBeInViewport();
  });

  test("is accessible and fits the screen", async ({ page }) => {
    await page.goto("/");
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test("offers a skip link as the first focusable element", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is checked on desktop");
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  });
});

test.describe("public pages", () => {
  for (const path of ["/login", "/signup", "/forgot-password", "/privacy", "/terms"]) {
    test(`${path} is accessible and fits the screen`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expectNoAxeViolations(page);
      await expectNoHorizontalScroll(page);
    });
  }

  test("legal pages are clearly marked as drafts", async ({ page }) => {
    for (const path of ["/privacy", "/terms"]) {
      await page.goto(path);
      await expect(page.getByRole("note")).toContainText("Draft");
    }
  });

  test("unknown pages return 404 with a way back", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to the home page" })).toBeVisible();
  });
});

test.describe("access control", () => {
  for (const path of ["/app", "/app/tutor", "/app/planner", "/app/settings", "/onboarding"]) {
    test(`${path} sends signed-out visitors to log in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(
        new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/[?]/g, "\\?")}`),
      );
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    });
  }

  test("the tutor API rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/tutor", { data: { message: "Hello" } });
    expect([401, 503]).toContain(response.status());
    const body = await response.json();
    expect(["unauthenticated", "auth_not_configured"]).toContain(body.code);
  });

  test("the tutor API only accepts POST", async ({ request }) => {
    expect((await request.get("/api/tutor")).status()).toBe(405);
  });

  test("log-in ignores off-site redirect targets", async ({ page }) => {
    await page.goto("/login?next=https://evil.example");
    await expect(page.locator("input[name=next]")).toHaveValue("/app");
  });
});

test.describe("platform", () => {
  test("health endpoint reports ok and is never cached", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = await response.json();
    expect(body.status).toBe("ok");
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
});
