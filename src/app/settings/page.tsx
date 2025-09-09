
"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { updateUserSettings } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface SettingsItemProps {
  label: string;
  value?: string;
  isToggle?: boolean;
  onToggle?: (checked: boolean) => void;
  checked?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}

function SettingsItem({ label, value, isToggle, onToggle, checked, href, onClick, disabled, tooltip }: SettingsItemProps) {
  const content = (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      className={`flex items-center justify-between p-4 bg-card ${onClick && !disabled ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'} ${disabled ? 'opacity-50' : ''}`}
    >
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2 text-muted-foreground">
        {isToggle ? (
            <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
        ) : (
          <>
            <span>{value}</span>
            <Icons.chevronRight className="h-5 w-5" />
          </>
        )}
      </div>
    </div>
  );
  
  const maybeTooltip = (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="w-full">{content}</div>
            </TooltipTrigger>
            {tooltip && <TooltipContent><p>{tooltip}</p></TooltipContent>}
        </Tooltip>
    </TooltipProvider>
  )


  if (href && !disabled) {
    return <Link href={href}>{tooltip ? maybeTooltip : content}</Link>;
  }
  return tooltip ? maybeTooltip : content;
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
                    <React.Fragment key={index}>
                        {child}
                        {index < React.Children.count(children) - 1 && <Separator className="bg-border/50" />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

function SettingsSkeleton() {
    return (
        <div className="p-4 space-y-6">
            {[...Array(3)].map((_, i) => (
                 <div key={i}>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <div className="bg-secondary rounded-lg p-4 space-y-4">
                        {[...Array(2)].map((_, j) => (
                            <div key={j} className="flex justify-between items-center">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SettingsPage() {
    const { user: authUser, userProfile, isGuest, loading } = useAuth();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        isPrivate: userProfile?.isPrivate || false,
        showActivityStatus: userProfile?.showActivityStatus || false,
    });

    useEffect(() => {
        if (userProfile) {
            setSettings({
                isPrivate: userProfile.isPrivate || false,
                showActivityStatus: userProfile.showActivityStatus || false,
            });
        }
    }, [userProfile]);


    const handleSettingChange = async (key: 'isPrivate' | 'showActivityStatus', value: boolean) => {
        if (!authUser || !userProfile) return;
        
        const originalSettings = { ...settings };
        setSettings(prev => ({ ...prev, [key]: value }));

        try {
            await updateUserSettings(authUser.uid, { [key]: value });
            toast({ title: "Settings updated!" });
        } catch (error) {
            setSettings(originalSettings);
            console.error("Failed to update setting", error);
            toast({ title: "Update failed", description: "Your setting could not be saved.", variant: "destructive" });
        }
    };
    
    const handlePasswordChange = async () => {
        if (!authUser?.email) {
            toast({ title: "Cannot reset password", description: "No email associated with this account.", variant: "destructive" });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, authUser.email);
            toast({
                title: "Password Reset Email Sent",
                description: `An email has been sent to ${authUser.email} with instructions to reset your password.`
            });
        } catch(error) {
            console.error("Password reset error:", error);
            toast({ title: "Error", description: "Could not send password reset email.", variant: "destructive" });
        }
    };

    const isDisabled = isGuest || loading;
    const profileLink = !isGuest && userProfile?.username ? `/profile/${userProfile.username}` : '/feed';

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
          <Button asChild variant="ghost" size="icon">
            <Link href={profileLink}>
              <Icons.back />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-xl font-semibold mx-auto">Settings</h1>
          <div className="w-9"></div> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          {loading ? <SettingsSkeleton /> : (
            <div className="p-4 space-y-6">
                <SettingsGroup title="Account">
                    <SettingsItem label="Edit Profile" href="/settings/profile" disabled={isDisabled} />
                    <SettingsItem label="Password" value="Change" onClick={handlePasswordChange} disabled={isDisabled} />
                </SettingsGroup>

                <SettingsGroup title="Appearance">
                    <div className="p-4 flex justify-around">
                        <Button variant={theme === 'default' ? 'default' : 'outline'} onClick={() => setTheme('default')}>Default</Button>
                        <Button variant={theme === 'vibrant' ? 'default' : 'outline'} onClick={() => setTheme('vibrant')}>Vibrant</Button>
                    </div>
                </SettingsGroup>

                <SettingsGroup title="Privacy">
                    <SettingsItem 
                        label="Private Account" 
                        isToggle 
                        checked={settings.isPrivate} 
                        onToggle={(checked) => handleSettingChange('isPrivate', checked)}
                        disabled={isDisabled}
                    />
                    <SettingsItem 
                        label="Show Activity Status" 
                        isToggle 
                        checked={settings.showActivityStatus} 
                        onToggle={(checked) => handleSettingChange('showActivityStatus', checked)}
                        disabled={isDisabled}
                    />
                </SettingsGroup>
                
                {isGuest && (
                    <div className="text-center p-4 bg-secondary rounded-lg">
                        <p className="font-semibold mb-2">Create an account to manage settings</p>
                        <p className="text-sm text-muted-foreground mb-4">You're currently browsing as a guest.</p>
                        <Button asChild>
                            <Link href="/signup">Sign Up Now</Link>
                        </Button>
                    </div>
                )}
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
