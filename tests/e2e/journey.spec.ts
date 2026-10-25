import { expect, test, type Page } from "@playwright/test";

import {
  authAvailable,
  completeOnboarding,
  expectNoAxeViolations,
  expectNoHorizontalScroll,
  signUp,
} from "./helpers";

/**
 * Critical student journeys against a real Supabase (local stack in CI and the
 * sandbox) with TUTOR_PROVIDER=test, whose replies are labelled as not AI.
 */
test.beforeEach(async ({ page }) => {
  test.skip(!(await authAvailable(page)), "Supabase is not configured for this run");
});

async function dialog(page: Page, name: string | RegExp) {
  const d = page.getByRole("dialog", { name });
  await expect(d).toBeVisible();
  return d;
}

test("sign up, onboard and land on a personalised dashboard", async ({ page }) => {
  await signUp(page, "Priya");
  await expect(page.getByRole("heading", { name: "Let's make Lumio yours." })).toBeVisible();
  await expectNoAxeViolations(page);
  await completeOnboarding(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /^Good (morning|afternoon|evening), Priya$/,
  );
  await expect(page.getByRole("link", { name: /Mathematics/ }).first()).toBeVisible();
  await expectNoAxeViolations(page);
  await expectNoHorizontalScroll(page);
});

test("onboarding resumes where the student left off and cannot be skipped ahead", async ({
  page,
}) => {
  await signUp(page);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByText("University").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=3/);
  await page.goto("/onboarding?step=6");
  await expect(page).toHaveURL(/step=3/);
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "What are you studying?" })).toBeVisible();
  // Validation: at least one subject.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Add at least one subject.").last()).toBeVisible();
});

test("full study journey: subjects, planner, tutor, revision, quiz, progress, settings", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The full journey runs on desktop; mobile layouts are checked separately");
  test.setTimeout(120_000);
  await signUp(page);
  await completeOnboarding(page);

  await test.step("add a subject with a topic", async () => {
    await page.goto("/app/learning");
    await page.getByRole("button", { name: "Add subject" }).first().click();
    const d = await dialog(page, /subject/i);
    await d.getByLabel("Subject name").fill("Chemistry");
    await d.getByLabel("Qualification or course").fill("GCSE");
    await d.getByRole("button", { name: "Add subject" }).click();
    await expect(page.getByRole("heading", { name: "Chemistry", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Add topic" }).click();
    await page.getByLabel("Topic name").fill("Atomic structure");
    await page.getByRole("button", { name: "Add topic" }).last().click();
    await expect(page.getByText("Atomic structure").first()).toBeVisible();
  });

  await test.step("plan, complete, reopen, edit and delete a task", async () => {
    await page.goto("/app/planner?new=1");
    const d = await dialog(page, /task/i);
    await d.getByLabel("What will you study?").fill("Balance equations");
    await d.getByLabel("Subject").selectOption({ label: "Chemistry" });
    await d.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByText("Balance equations").first()).toBeVisible();

    await page.getByRole("checkbox", { name: "Mark “Balance equations” complete" }).click();
    await expect(page.getByRole("checkbox", { name: "Reopen “Balance equations”" })).toBeVisible();
    await page.reload();
    await page.getByRole("checkbox", { name: "Reopen “Balance equations”" }).click();
    await expect(
      page.getByRole("checkbox", { name: "Mark “Balance equations” complete" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Options for “Balance equations”" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const edit = await dialog(page, /task/i);
    await edit.getByLabel("What will you study?").fill("Balance chemical equations");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Balance chemical equations").first()).toBeVisible();

    await page.getByRole("button", { name: "Options for “Balance chemical equations”" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const confirm = await dialog(page, "Delete this task?");
    await confirm.getByRole("button", { name: "Delete task" }).click();
    await expect(page.getByText("Balance chemical equations")).toHaveCount(0);
  });

  await test.step("ask the tutor, recover from a failure and keep the conversation", async () => {
    await page.goto("/app/tutor");
    await expect(page.getByRole("heading", { name: "What's on your mind?" })).toBeVisible();
    await expect(page.getByText("Test mode — replies aren't AI")).toBeVisible();
    const box = page.getByLabel("Message the tutor");

    await box.fill("[test:fail] What is a mole?");
    await box.press("Enter");
    await expect(page.getByRole("alert").filter({ hasText: /Try again|try again/ })).toBeVisible();
    await expect(box).toHaveValue("[test:fail] What is a mole?");

    await box.fill("What is a mole?");
    await box.press("Shift+Enter");
    await expect(box).toHaveValue("What is a mole?\n");
    await box.press("Enter");
    await expect(page.getByText("Test response — not generated by AI.")).toBeVisible();
    await expect(page).toHaveURL(/\/app\/tutor\/[0-9a-f-]{36}$/);
    await expect(page.locator(".katex").first()).toBeVisible();

    await page.reload();
    await expect(page.getByText("What is a mole?").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /What is a mole\?/ })).toBeVisible();
  });

  await test.step("make flashcards and review them", async () => {
    await page.goto("/app/revision?new=collection");
    const d = await dialog(page, /collection/i);
    await d.getByLabel("Collection name").fill("Chemistry basics");
    await d.getByRole("button", { name: "Create collection" }).click();
    await expect(page.getByRole("heading", { name: "Chemistry basics" })).toBeVisible();
    for (const [front, back] of [
      ["Symbol for sodium", "Na"],
      ["pH of a neutral solution", "7"],
    ]) {
      await page.getByLabel("Front (question or prompt)").fill(front!);
      await page.getByLabel("Back (answer)").fill(back!);
      await page.getByRole("button", { name: "Add card" }).click();
      await expect(page.getByText(front!)).toBeVisible();
    }
    await page
      .getByRole("link", { name: /review/i })
      .first()
      .click();
    for (const remembered of [true, false]) {
      await page.getByRole("button", { name: "Show answer" }).click();
      await page
        .getByRole("button", { name: remembered ? /remembered/i : /not yet|forgot|didn/i })
        .first()
        .click();
    }
    await expect(page.getByText("Review complete")).toBeVisible();
  });

  await test.step("build a quiz, take it and see the score", async () => {
    await page.goto("/app/revision?new=quiz");
    const d = await dialog(page, /quiz/i);
    await d.getByLabel("Quiz title").fill("Periodic table");
    await d.getByRole("button", { name: "Create quiz" }).click();
    await expect(page.getByRole("heading", { name: "Periodic table" })).toBeVisible();
    await page.getByLabel("Question", { exact: true }).fill("Which element has atomic number 1?");
    await page.getByLabel("Option A", { exact: true }).fill("Helium");
    await page.getByLabel("Option B", { exact: true }).fill("Hydrogen");
    await page.getByLabel("Option B is correct").check();
    await page.getByLabel("Explanation shown after answering").fill("Hydrogen has one proton.");
    await page.getByRole("button", { name: "Add question" }).click();
    await expect(page.getByText("Which element has atomic number 1?")).toBeVisible();

    await page.getByRole("link", { name: "Take quiz" }).first().click();
    await page.getByLabel("Hydrogen").check();
    await page.getByRole("button", { name: "Submit answers" }).click();
    await expect(page.getByText("Your result")).toBeVisible();
    await expect(page.getByText(/1\s*(\/|of)\s*1/).first()).toBeVisible();
    await expect(page.getByText("Hydrogen has one proton.").first()).toBeVisible();
  });

  await test.step("progress reflects the real activity", async () => {
    await page.goto("/app/progress");
    const tile = (label: string) =>
      page
        .getByRole("region", { name: "Totals" })
        .getByText(label, { exact: true })
        .locator("..")
        .locator("..");
    await expect(tile("Flashcards reviewed")).toContainText("2");
    await expect(tile("Quizzes completed")).toContainText("1");
    await expect(tile("Tutor questions")).toContainText("1");
    await expectNoAxeViolations(page);
  });

  await test.step("update preferences in settings", async () => {
    await page.goto("/app/settings");
    await page.getByText("Stay organised").click();
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "Stay organised" })).toBeChecked();
  });
});

test("app pages are accessible and fit a small screen", async ({ page }) => {
  test.setTimeout(90_000);
  await signUp(page);
  await completeOnboarding(page);
  for (const path of [
    "/app",
    "/app/tutor",
    "/app/learning",
    "/app/planner",
    "/app/revision",
    "/app/progress",
    "/app/settings",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  }
});

test("students cannot open each other's records", async ({ browser }) => {
  const a = await browser.newPage();
  await signUp(a, "Ana");
  await completeOnboarding(a);
  await a.goto("/app/tutor");
  await a.getByLabel("Message the tutor").fill("Private question");
  await a.getByLabel("Message the tutor").press("Enter");
  await expect(a).toHaveURL(/\/app\/tutor\/[0-9a-f-]{36}$/);
  const conversationUrl = a.url();
  await a.goto("/app/learning");
  await a
    .getByRole("link", { name: /Mathematics/ })
    .first()
    .click();
  await expect(a).toHaveURL(/\/app\/learning\/[0-9a-f-]{36}$/);
  const subjectUrl = a.url();

  const b = await browser.newPage();
  await signUp(b, "Ben");
  await completeOnboarding(b);
  // Pages stream, so the status is sent before the lookup finishes; the content is
  // the not-found page and none of Ana's data is shown.
  for (const url of [conversationUrl, subjectUrl]) {
    await b.goto(url);
    await expect(b.getByText("We couldn't find that")).toBeVisible();
    await expect(b.getByText("Private question")).toHaveCount(0);
  }
  const conversationId = conversationUrl.split("/").pop();
  const api = await b.request.post("/api/tutor", { data: { message: "Hi", conversationId } });
  expect(api.status()).toBe(404);
});
