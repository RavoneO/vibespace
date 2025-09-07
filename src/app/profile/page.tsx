import { redirect } from "next/navigation";

export default function ProfilePage() {
  // Redirect to the main feed as a sensible default.
  // The user can navigate to their specific profile via the sidebar.
  redirect("/feed");
}
