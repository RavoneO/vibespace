
import { ProfileClientPage } from "./profile-client-page";

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  return <ProfileClientPage username={params.username} />;
}
