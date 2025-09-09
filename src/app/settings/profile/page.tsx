
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/services/userService";

import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be less than 50 characters."),
  bio: z.string().max(150, "Bio must be less than 150 characters.").optional(),
  avatar: z.any(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || "",
      bio: userProfile?.bio || "",
      avatar: null,
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("avatar", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
        toast({ title: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        await updateUserProfile(user.uid, {
            name: data.name,
            bio: data.bio || "",
            avatarFile: data.avatar,
        });
        toast({ title: "Profile updated successfully!" });
        // Optionally force a reload of userProfile in useAuth hook or just navigate
        router.push(`/profile/${userProfile?.username}`);
        router.refresh(); // Refresh the page to show new profile info
    } catch (error: any) {
        console.error("Failed to update profile", error);
        toast({ 
            title: "Failed to update profile.", 
            description: error.message.replace('Failed to update user profile:', '').trim(),
            variant: "destructive" 
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading || !userProfile) {
    return (
        <AppLayout>
            <div className="flex items-center justify-center h-full">
                <Icons.spinner className="animate-spin text-primary h-12 w-12" />
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="flex items-center p-4 border-b">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/profile/${userProfile.username}`}>
              <Icons.back />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold mx-auto">Edit Profile</h1>
          <div className="w-9"></div> {/* Spacer */}
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md mx-auto">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarPreview || userProfile.avatar} />
                  <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <label htmlFor="avatar-upload" className="cursor-pointer text-primary font-semibold text-sm hover:underline">
                            Change profile photo
                          </label>
                          <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about yourself" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Icons.spinner className="animate-spin" /> : "Save Changes"}
              </Button>
            </form>
          </Form>
        </main>
      </div>
    </AppLayout>
  );
}

    
