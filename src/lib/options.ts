/** Fixed option sets shared by onboarding, settings and validation. Keys match database checks. */

export const EDUCATION_LEVELS = [
  { value: "secondary", label: "Secondary school" },
  { value: "sixth_form_college", label: "Sixth form or college" },
  { value: "university", label: "University" },
  { value: "other", label: "Something else" },
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]["value"];

export const GOALS = [
  { value: "understand_topics", label: "Understand difficult topics" },
  { value: "prepare_exams", label: "Prepare for exams" },
  { value: "improve_grades", label: "Improve my grades" },
  { value: "revision_routine", label: "Build a revision routine" },
  { value: "remember_more", label: "Remember information more effectively" },
  { value: "stay_organised", label: "Stay organised" },
] as const;
export type Goal = (typeof GOALS)[number]["value"];

export const LEARNING_PREFERENCES = [
  {
    value: "step_by_step",
    label: "Step-by-step explanations",
    hint: "Break things down one step at a time.",
  },
  {
    value: "examples",
    label: "Examples and analogies",
    hint: "Connect new ideas to familiar ones.",
  },
  { value: "practice", label: "Practice questions", hint: "Learn by trying questions early." },
  {
    value: "visual",
    label: "Visual explanations",
    hint: "Describe structure, diagrams and layouts.",
  },
  { value: "mixed", label: "A mixture of approaches", hint: "Whatever suits the topic." },
] as const;
export type LearningPreference = (typeof LEARNING_PREFERENCES)[number]["value"];

export const SUGGESTED_SUBJECTS = [
  "Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "English",
  "Economics",
  "Business",
  "History",
  "Computer Science",
] as const;

export const TASK_PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

export function labelFor<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | null | undefined,
): string | null {
  return options.find((o) => o.value === value)?.label ?? null;
}
