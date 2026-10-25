import { describe, expect, it } from "vitest";

import {
  educationStepSchema,
  goalsSchema,
  newPasswordSchema,
  quizQuestionSchema,
  signUpSchema,
  subjectsStepSchema,
  taskSchema,
  tutorRequestSchema,
  TUTOR_MESSAGE_MAX,
} from "./validation";

describe("validation", () => {
  it("requires the age confirmation at sign-up and normalises email", () => {
    const base = { displayName: "Sam", email: "  Sam@Example.COM ", password: "longenough" };
    expect(signUpSchema.safeParse(base).success).toBe(false);
    const ok = signUpSchema.parse({ ...base, ageConfirmed: "on" });
    expect(ok.email).toBe("sam@example.com");
  });

  it("checks new passwords match and are long enough", () => {
    expect(
      newPasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({ password: "longenough", confirmPassword: "different1" })
        .success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({ password: "longenough", confirmPassword: "longenough" })
        .success,
    ).toBe(true);
  });

  it("needs a description when the stage is 'other'", () => {
    expect(
      educationStepSchema.safeParse({ educationLevel: "other", educationLevelOther: "" }).success,
    ).toBe(false);
    expect(
      educationStepSchema.safeParse({ educationLevel: "university", educationLevelOther: "" })
        .success,
    ).toBe(true);
    expect(
      educationStepSchema.safeParse({ educationLevel: "wizard", educationLevelOther: "" }).success,
    ).toBe(false);
  });

  it("rejects duplicate or empty subject lists and unknown goals", () => {
    expect(subjectsStepSchema.safeParse([]).success).toBe(false);
    expect(subjectsStepSchema.safeParse(["Maths", "maths"]).success).toBe(false);
    expect(subjectsStepSchema.safeParse(["Maths", "Biology"]).success).toBe(true);
    expect(goalsSchema.safeParse(["prepare_exams"]).success).toBe(true);
    expect(goalsSchema.safeParse(["take_over_the_world"]).success).toBe(false);
  });

  it("limits tutor messages and checks ids", () => {
    expect(tutorRequestSchema.safeParse({ message: "Hi" }).success).toBe(true);
    expect(tutorRequestSchema.safeParse({ message: "   " }).success).toBe(false);
    expect(
      tutorRequestSchema.safeParse({ message: "x".repeat(TUTOR_MESSAGE_MAX + 1) }).success,
    ).toBe(false);
    expect(
      tutorRequestSchema.safeParse({ message: "Hi", conversationId: "not-a-uuid" }).success,
    ).toBe(false);
  });
});

describe("task and quiz schemas", () => {
  it("rejects an invalid date", () => {
    const result = taskSchema.safeParse({
      title: "Revise",
      scheduledDate: "2026-02-31",
      priority: "medium",
    });
    expect(result.success).toBe(false);
  });

  it("requires the correct option to be one of the provided options", () => {
    const valid = quizQuestionSchema.safeParse({
      prompt: "2 + 2?",
      options: ["3", "4"],
      correctOption: 1,
      explanation: "",
    });
    expect(valid.success).toBe(true);
    const invalid = quizQuestionSchema.safeParse({
      prompt: "2 + 2?",
      options: ["3", "4"],
      correctOption: 2,
      explanation: "",
    });
    expect(invalid.success).toBe(false);
  });
});
