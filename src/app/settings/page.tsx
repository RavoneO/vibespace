
"use client";

import React, { useEffect, useState } from "react";
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
    const { theme, toggleTheme } = useTheme();
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        isPrivate: userProfile?.isPrivate || false,
        showActivityStatus: userProfile?.showActivityStatus || false,
        dataSaver: userProfile?.dataSaver || false,
        increaseContrast: userProfile?.increaseContrast || false,
        reduceMotion: userProfile?.reduceMotion || false,
        pushNotifications: userProfile?.notifications?.push || false,
        emailNotifications: userProfile?.notifications?.email || false,
        inAppNotifications: userProfile?.notifications?.inApp || false,
        filterSensitiveContent: userProfile?.filterSensitiveContent || false,
        twoFactorAuth: userProfile?.twoFactorAuth || false,
    });

    useEffect(() => {
        if (userProfile) {
            setSettings({
                isPrivate: userProfile.isPrivate || false,
                showActivityStatus: userProfile.showActivityStatus || false,
                dataSaver: userProfile.dataSaver || false,
                increaseContrast: userProfile.increaseContrast || false,
                reduceMotion: userProfile.reduceMotion || false,
                pushNotifications: userProfile.notifications?.push || false,
                emailNotifications: userProfile.notifications?.email || false,
                inAppNotifications: userProfile.notifications?.inApp || false,
                filterSensitiveContent: userProfile.filterSensitiveContent || false,
                twoFactorAuth: userProfile.twoFactorAuth || false,
            });
        }
    }, [userProfile]);


    const handleSettingChange = async (key: Exclude<keyof typeof settings, 'pushNotifications' | 'emailNotifications' | 'inAppNotifications'>, value: boolean) => {
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

    const handleNotificationChange = async (type: 'push' | 'email' | 'inApp', value: boolean) => {
        if (!authUser || !userProfile) return;

        const key = `${type}Notifications` as const;
        const originalSettings = { ...settings };
        setSettings(prev => ({ ...prev, [key]: value }));

        try {
            await updateUserSettings(authUser.uid, {
                notifications: {
                    ...(userProfile.notifications || {}),
                    [type]: value,
                }
            });
            toast({ title: "Settings updated!" });
        } catch (error) {
            setSettings(originalSettings);
            console.error("Failed to update notification setting", error);
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

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      {loading ? <SettingsSkeleton /> : (
        <div className="p-4 space-y-6">
            <SettingsGroup title="Account">
                <SettingsItem label="Edit Profile" href="/settings/profile" disabled={isDisabled} />
                <SettingsItem label="Change Password" onClick={handlePasswordChange} disabled={isDisabled} />
            </SettingsGroup>

            <SettingsGroup title="Security">
                <SettingsItem 
                    label="Two-Factor Authentication" 
                    isToggle 
                    checked={settings.twoFactorAuth} 
                    onToggle={(checked) => handleSettingChange('twoFactorAuth', checked)}
                    disabled={isDisabled}
                    tooltip="Add an extra layer of security to your account."
                />
            </SettingsGroup>

            <SettingsGroup title="Appearance">
                <SettingsItem 
                    label="Dark Mode" 
                    isToggle 
                    checked={theme === 'dark'} 
                    onToggle={toggleTheme}
                />
            </SettingsGroup>

            <SettingsGroup title="Notifications">
                <SettingsItem 
                    label="Push Notifications" 
                    isToggle 
                    checked={settings.pushNotifications} 
                    onToggle={(checked) => handleNotificationChange('push', checked)}
                    disabled={isDisabled}
                    tooltip="Receive notifications outside the app."
                />
                <SettingsItem 
                    label="Email Notifications" 
                    isToggle 
                    checked={settings.emailNotifications} 
                    onToggle={(checked) => handleNotificationChange('email', checked)}
                    disabled={isDisabled}
                    tooltip="Receive important notifications via email."
                />
                <SettingsItem 
                    label="In-app Notifications" 
                    isToggle 
                    checked={settings.inAppNotifications} 
                    onToggle={(checked) => handleNotificationChange('inApp', checked)}
                    disabled={isDisabled}
                    tooltip="Show notifications inside the app."
                />
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
                <SettingsItem 
                    label="Blocked Accounts"
                    href="/settings/blocked-users"
                    disabled={isDisabled}
                />
            </SettingsGroup>

            <SettingsGroup title="Content Preferences">
                <SettingsItem 
                    label="Manage Interests"
                    href="/settings/interests"
                    disabled={isDisabled}
                />
                <SettingsItem 
                    label="Filter Sensitive Content" 
                    isToggle 
                    checked={settings.filterSensitiveContent} 
                    onToggle={(checked) => handleSettingChange('filterSensitiveContent', checked)}
                    disabled={isDisabled}
                    tooltip="Hides content that may be sensitive or disturbing to some users."
                />
            </SettingsGroup>

            <SettingsGroup title="Data & Performance">
                <SettingsItem 
                    label="Data Saver" 
                    isToggle 
                    checked={settings.dataSaver} 
                    onToggle={(checked) => handleSettingChange('dataSaver', checked)}
                    disabled={isDisabled}
                    tooltip="Reduces the quality of images and videos to save data."
                />
            </SettingsGroup>

            <SettingsGroup title="Accessibility">
                <SettingsItem 
                    label="Increase Contrast" 
                    isToggle 
                    checked={settings.increaseContrast} 
                    onToggle={(checked) => handleSettingChange('increaseContrast', checked)}
                    disabled={isDisabled}
                    tooltip="Increases color contrast to improve readability."
                />
                <SettingsItem 
                    label="Reduce Motion" 
                    isToggle 
                    checked={settings.reduceMotion} 
                    onToggle={(checked) => handleSettingChange('reduceMotion', checked)}
                    disabled={isDisabled}
                    tooltip="Reduces animations and motion effects."
                />
            </SettingsGroup>

            <SettingsGroup title="Help & Support">
                <SettingsItem label="Visit Help Center" href="/settings/help-center" disabled={isDisabled} />
                <SettingsItem label="Report a Problem" href="/settings/report-a-problem" disabled={isDisabled} />
            </SettingsGroup>

            <SettingsGroup title="About">
                <SettingsItem label="Terms of Service" href="/settings/terms-of-service" disabled={isDisabled} />
                <SettingsItem label="Privacy Policy" href="/settings/privacy-policy" disabled={isDisabled} />
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
  );
}
