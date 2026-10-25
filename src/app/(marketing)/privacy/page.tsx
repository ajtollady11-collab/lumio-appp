import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy notice (draft)" };

export default function PrivacyPage() {
  const n = brand.name;
  return (
    <LegalPage title="Privacy notice" updated="25 October 2026">
      <p>
        This notice explains what {n} collects, why, who it is shared with and the choices you have.{" "}
        {n} is designed for learners aged 13 and over.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your email address, first name and a securely hashed password.</li>
        <li>
          Profile answers you choose to give: stage of education, goals and how you like things
          explained.
        </li>
        <li>
          Your learning content: subjects, topics, study tasks, flashcards, quizzes and quiz
          results.
        </li>
        <li>Tutor conversations, and a count of tutor requests used to apply fair-use limits.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>
        Only to provide the service to you: to show your own work back to you, to personalise tutor
        explanations and to keep the service secure. We do not sell your data, show advertising or
        use your content to train AI models.
      </p>
      <h2>Who we share it with</h2>
      <ul>
        <li>Supabase — stores your account and learning data.</li>
        <li>Vercel — hosts the website.</li>
        <li>
          Anthropic — when you ask the tutor a question, your message, recent messages in that
          conversation and your profile answers are sent to generate a reply. Your name and email
          are not sent.
        </li>
      </ul>
      <h2>How long we keep it</h2>
      <p>
        Until you delete it or delete your account. Deleting your account in Settings removes your
        data from the live database immediately; copies in encrypted backups expire after a limited
        period.
      </p>
      <h2>Your rights</h2>
      <p>
        You can see and change your information in the app, and delete your account at any time.
        Under UK data protection law you can also ask for a copy of your data or object to how it is
        used. Contact details for these requests will be published here before launch.
      </p>
    </LegalPage>
  );
}
