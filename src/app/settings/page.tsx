import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const sections = [
    {
      title: "How you use Vibespace",
      items: [
        { icon: Icons.editProfile, label: "Edit Profile", href: "/profile/edit" },
        { icon: Icons.yourActivity, label: "Your activity", href: "/settings/activity" },
        { icon: Icons.notifications, label: "Notifications", href: "/settings/notifications" },
      ],
    },
    {
      title: "Who can see your content",
      items: [
        { icon: Icons.accountPrivacy, label: "Account privacy", href: "/settings/privacy" },
        { icon: Icons.closeFriends, label: "Close Friends", href: "/settings/close-friends" },
        { icon: Icons.blocked, label: "Blocked", href: "/settings/blocked" },
        { icon: Icons.hideStory, label: "Hide story", href: "/settings/hide-story" },
      ],
    },
    {
      title: "How others can interact with you",
      items: [
        { icon: Icons.messagesAndStoryReplies, label: "Messages and story replies", href: "/settings/messages" },
        { icon:Icons.tagsAndMentions, label: "Tags and mentions", href: "/settings/tags" },
        { icon: Icons.comment, label: "Comments", href: "/settings/comments" },
        { icon: Icons.sharingAndReuse, label: "Sharing and reuse", href: "/settings/sharing" },
        { icon: Icons.restrictedAccounts, label: "Restricted accounts", href: "/settings/restricted" },
        { icon: Icons.hiddenWords, label: "Hidden words", href: "/settings/hidden-words" },
      ],
    },
  ];
  
  export default function SettingsPage() {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center p-4 border-b">
          <Button asChild variant="ghost" size="icon">
            <Link href="/profile">
              <Icons.back />
              <span className="sr-only">Back to profile</span>
            </Link>
          </Button>
          <h1 className="text-lg font-semibold mx-auto">Settings and privacy</h1>
          <div className="w-9"></div>
        </header>
        <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-2">{section.title}</h2>
              <div className="bg-secondary rounded-lg">
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={item.href}>
                    <Link href={item.href} className="block hover:bg-muted/50 rounded-md">
                      <div className="flex items-center justify-between p-4 cursor-pointer">
                        <div className="flex items-center gap-4">
                          <item.icon className="w-6 h-6 text-foreground/80" />
                          <span className="text-base">{item.label}</span>
                        </div>
                        <Icons.chevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>
                    {itemIndex < section.items.length - 1 && <Separator className="bg-border/50" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
            </div>
        </main>
      </div>
    );
  }
  
  import * as React from "react";
  
