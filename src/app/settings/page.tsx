
"use client";

import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

interface SettingsItemProps {
  label: string;
  value?: string;
  isToggle?: boolean;
  onToggle?: (checked: boolean) => void;
  checked?: boolean;
  href?: string;
}

function SettingsItem({ label, value, isToggle, onToggle, checked, href }: SettingsItemProps) {
  const content = (
    <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 cursor-pointer">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2 text-muted-foreground">
        {isToggle ? (
            <Switch checked={checked} onCheckedChange={onToggle} />
        ) : (
          <>
            <span>{value}</span>
            <Icons.chevronRight className="h-5 w-5" />
          </>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

interface SettingsGroupProps {
    title: string;
    children: React.ReactNode;
}

function SettingsGroup({ title, children }: SettingsGroupProps) {
    return (
        <div>
            <h2 className="text-sm font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wider">{title}</h2>
            <div className="bg-secondary rounded-lg overflow-hidden">
                {React.Children.toArray(children).map((child, index) => (
                    <>
                        {child}
                        {index < React.Children.count(children) - 1 && <Separator className="bg-border/50" />}
                    </>
                ))}
            </div>
        </div>
    )
}

export default function SettingsPage() {
    const { user } = useAuth();
    // Dummy state for toggles
    const [privateAccount, setPrivateAccount] = React.useState(false);
    const [showActivity, setShowActivity] = React.useState(true);
    const [pushNotifications, setPushNotifications] = React.useState(true);
    const [emailNotifications, setEmailNotifications] = React.useState(false);
    const [inAppSounds, setInAppSounds] = React.useState(true);


  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/profile/${user?.displayName || ''}`}>
              <Icons.back />
              <span className="sr-only">Back to profile</span>
            </Link>
          </Button>
          <h1 className="text-xl font-semibold mx-auto">Settings</h1>
          <div className="w-9"></div> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 space-y-6">
            <SettingsGroup title="Account">
                <SettingsItem label="Username" value={`@${user?.displayName || 'guest'}`} href="#" />
                <SettingsItem label="Email" value={user?.email || 'guest@example.com'} href="#" />
                <SettingsItem label="Phone Number" value="+1 (555) 123-4567" href="#" />
                <SettingsItem label="Password" value="Change" href="#" />
            </SettingsGroup>

            <SettingsGroup title="Privacy">
                <SettingsItem label="Private Account" isToggle checked={privateAccount} onToggle={setPrivateAccount} />
                <SettingsItem label="Show Activity Status" isToggle checked={showActivity} onToggle={setShowActivity} />
                <SettingsItem label="Direct Messages" value="Everyone" href="#" />
            </SettingsGroup>

             <SettingsGroup title="Notifications">
                <SettingsItem label="Push Notifications" isToggle checked={pushNotifications} onToggle={setPushNotifications} />
                <SettingsItem label="Email Notifications" isToggle checked={emailNotifications} onToggle={setEmailNotifications} />
                <SettingsItem label="In-App Sounds" isToggle checked={inAppSounds} onToggle={setInAppSounds} />
            </SettingsGroup>

             <SettingsGroup title="App Preferences">
                <SettingsItem label="Language" value="English" href="#" />
                <SettingsItem label="Theme" value="System Default" href="#" />
                <SettingsItem label="Font Size" value="Medium" href="#" />
            </SettingsGroup>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
