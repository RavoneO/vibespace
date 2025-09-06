import { redirect } from "next/navigation";

export default function ProfilePage() {
  // Redirect to a default user's profile for demonstration
  redirect("/profile/vibedog");
}
