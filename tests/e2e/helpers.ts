import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) })),
  ).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** True when the deployment under test has Supabase configured (sign-up form enabled). */
export async function authAvailable(page: Page): Promise<boolean> {
  await page.goto("/signup");
  return page.getByRole("button", { name: "Create account" }).isEnabled();
}

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

/** Signs up a fresh student (the sandbox and local Supabase auto-confirm email). */
export async function signUp(page: Page, name = "Sam") {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByLabel("First name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("correct horse battery");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  return email;
}

export async function completeOnboarding(page: Page) {
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByRole("heading", { name: "What stage are you at?" })).toBeVisible();
  await page.getByText("Secondary school").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "What are you studying?" })).toBeVisible();
  await page.getByRole("button", { name: "Mathematics" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "What would you like to achieve?" }),
  ).toBeVisible();
  await page.getByText("Prepare for exams").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "How do you like things explained?" }),
  ).toBeVisible();
  await page.getByText("Step-by-step explanations").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "You're all set" })).toBeVisible();
  await page.getByRole("button", { name: "Open my dashboard" }).click();
  await expect(page).toHaveURL(/\/app(\?|$)/);
}
