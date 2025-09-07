
"use client";
import { ProfileClientPage } from "./profile-client-page";
import { useParams } from "next/navigation";

export default function UserProfilePage() {
  const params = useParams();
  const username = Array.isArray(params.username) ? params.username[0] : params.username;

  if (!username) {
    // You can render a loading state or null while waiting for params
    return null;
  }
  
  return <ProfileClientPage username={username} />;
}
