import { z } from "zod";

import { EDUCATION_LEVELS, GOALS, LEARNING_PREFERENCES, TASK_PRIORITIES } from "./options";

/** Shared result shape for server actions used with `useActionState`. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const idleState: ActionState = { status: "idle" };

/** Converts Zod issues to one message per field, using the first issue for each. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

const trimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .max(max, `Keep ${label} under ${max + 1} characters.`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max + 1} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null)
  .refine((v) => v === null || isCalendarDate(v), "Enter a valid date.");

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null)
  .refine((v) => v === null || z.uuid().safeParse(v).success, "Choose a valid option.");

const valuesOf = <T extends readonly { value: string }[]>(options: T) =>
  options.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

// --- Auth ---------------------------------------------------------------------
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Enter a valid email address.")
  .pipe(z.email("Enter a valid email address."));
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

export const signUpSchema = z.object({
  displayName: trimmed(50, "your first name"),
  email: emailSchema,
  password: passwordSchema,
  ageConfirmed: z.literal("on", { error: "Confirm that you are 13 or older to continue." }),
});

export const logInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const resetRequestSchema = z.object({ email: emailSchema });
export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: "The passwords don't match.",
    path: ["confirmPassword"],
  });

// --- Profile and onboarding ------------------------------------------------------
export const educationLevelSchema = z.enum(valuesOf(EDUCATION_LEVELS), {
  error: "Choose your current stage.",
});
export const goalsSchema = z
  .array(z.enum(valuesOf(GOALS)))
  .min(1, "Choose at least one goal.")
  .max(GOALS.length);
export const learningPreferenceSchema = z.enum(valuesOf(LEARNING_PREFERENCES)).nullable();

export const educationStepSchema = z
  .object({
    educationLevel: educationLevelSchema,
    educationLevelOther: optionalText(60, "your stage"),
  })
  .refine((v) => v.educationLevel !== "other" || v.educationLevelOther, {
    message: "Tell us your stage.",
    path: ["educationLevelOther"],
  });

export const subjectNameSchema = trimmed(80, "a subject name");
export const subjectsStepSchema = z
  .array(subjectNameSchema)
  .min(1, "Add at least one subject.")
  .max(12, "Add up to 12 subjects for now.")
  .refine(
    (names) => new Set(names.map((n) => n.toLowerCase())).size === names.length,
    "Each subject can only be added once.",
  );

export const profileSchema = z.object({
  displayName: trimmed(50, "your first name"),
  educationLevel: educationLevelSchema.nullable(),
  educationLevelOther: optionalText(60, "your stage"),
});

export const preferencesSchema = z.object({
  goals: goalsSchema,
  learningPreference: learningPreferenceSchema,
});

export const timezoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone.");

// --- Subjects and topics -----------------------------------------------------------
export const subjectSchema = z.object({
  name: subjectNameSchema,
  level: optionalText(80, "the level"),
  qualification: optionalText(80, "the qualification"),
  examBoard: optionalText(80, "the exam board"),
  examDate: optionalDate,
});

export const topicSchema = z.object({
  name: trimmed(120, "a topic name"),
  description: optionalText(1000, "the description"),
});

/** True for a real YYYY-MM-DD date (rejects 2026-02-31) within a sensible range. */
export function isCalendarDate(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d || y < 2000 || y > 2100) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// --- Planner ----------------------------------------------------------------------
export const taskSchema = z.object({
  title: trimmed(120, "a title"),
  description: optionalText(2000, "the description"),
  subjectId: optionalUuid,
  scheduledDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
    .refine(isCalendarDate, "Choose a real date between 2000 and 2100."),
  startTime: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null)
    .refine((v) => v === null || /^\d{2}:\d{2}$/.test(v), "Enter a valid time."),
  durationMinutes: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .nullable()
    .optional()
    .transform((v) => v ?? null)
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 5 && v <= 600),
      "Use 5 to 600 minutes.",
    ),
  priority: z.enum(valuesOf(TASK_PRIORITIES), { error: "Choose a priority." }),
});

// --- Revision -----------------------------------------------------------------------
export const collectionSchema = z.object({
  name: trimmed(80, "a name"),
  subjectId: optionalUuid,
});

export const flashcardSchema = z.object({
  front: trimmed(1000, "the question"),
  back: trimmed(2000, "the answer"),
  topic: optionalText(80, "the topic"),
});

export const quizSchema = z.object({
  title: trimmed(120, "a title"),
  description: optionalText(500, "the description"),
  subjectId: optionalUuid,
});

export const quizQuestionSchema = z
  .object({
    prompt: trimmed(1000, "the question"),
    options: z
      .array(z.string().trim().max(300, "Keep each option under 301 characters."))
      .transform((opts) => opts.filter((o) => o !== ""))
      .pipe(
        z.array(z.string()).min(2, "Add at least two options.").max(6, "Use at most six options."),
      ),
    correctOption: z.coerce.number().int().min(0, "Choose the correct answer."),
    explanation: optionalText(2000, "the explanation"),
  })
  .refine((q) => q.correctOption < q.options.length, {
    message: "Choose which option is correct.",
    path: ["correctOption"],
  })
  .refine((q) => new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, {
    message: "Each option must be different.",
    path: ["options"],
  });

// --- Tutor --------------------------------------------------------------------------
export const TUTOR_MESSAGE_MAX = 4000;
export const tutorRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Type a message first.")
    .max(TUTOR_MESSAGE_MAX, `Keep messages under ${TUTOR_MESSAGE_MAX + 1} characters.`),
  conversationId: z.uuid().nullable().optional(),
  subjectId: z.uuid().nullable().optional(),
});
