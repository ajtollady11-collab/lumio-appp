import { AccountSummaryView } from "@/components/app-shell/account-summary";
import { getSessionUser } from "@/server/auth";
import { getProfile } from "@/server/data/profile";

/** Streams in the signed-in student's name and email (reads the session). */
export async function Account() {
  const user = await getSessionUser();
  if (!user) return null;
  const profile = await getProfile();
  return <AccountSummaryView displayName={profile.display_name} email={user.email} />;
}
