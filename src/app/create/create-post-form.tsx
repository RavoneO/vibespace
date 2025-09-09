
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "use-debounce";
import { useAuth } from "@/hooks/use-auth";

import { createPost, updatePost } from "@/services/postService";
import { uploadFile } from "@/services/storageService";
import { searchUsers } from "@/services/userService";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PostTag, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formSchema = z.object({
  caption: z.string().max(2200, "Caption is too long."),
  file: z.any().refine((file) => file, "Please upload an image or video."),
});

function GuestPrompt() {
    const router = useRouter();
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-center">Create an Account to Post</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">You need to be logged in to create a post and share it with the community.</p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => router.push('/login')}>Log In</Button>
                    <Button onClick={() => router.push('/signup')} variant="secondary">Sign Up</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function CreatePostForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, loading, isGuest } = useAuth();
  
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaDataUri, setMediaDataUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New states for tagging
  const [tags, setTags] = useState<PostTag[]>([]);
  const [activeTaggingBox, setActiveTaggingBox] = useState<{box: number[], label: string} | null>(null);
  const [tagInput, setTagInput] = useState("");

  // New states for collaborators
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [collabSearchQuery, setCollabSearchQuery] = useState("");
  const [debouncedCollabSearchQuery] = useDebounce(collabSearchQuery, 300);
  const [collabSearchResults, setCollabSearchResults] = useState<User[]>([]);
  const [isSearchingCollabs, setIsSearchingCollabs] = useState(false);
  const [isCollabPopoverOpen, setIsCollabPopoverOpen] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: "",
      file: null,
    },
  });

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("file", file);
      const currentFileType = file.type.startsWith('image') ? 'image' : 'video';
      setFileType(currentFileType);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setMediaDataUri(result);
      };
      reader.readAsDataURL(file);
    }
  }, [form]);

  const handleSaveTag = () => {
    if (!tagInput.trim() || !activeTaggingBox) return;
    
    // Remove existing tag for this box if it exists
    const otherTags = tags.filter(t => t.box.toString() !== activeTaggingBox.box.toString());

    setTags([
      ...otherTags,
      { ...activeTaggingBox, text: tagInput }
    ]);
    setTagInput("");
    setActiveTaggingBox(null);
  };

  // Collaborator search logic
  useEffect(() => {
    async function searchForCollaborators() {
      if (debouncedCollabSearchQuery) {
        setIsSearchingCollabs(true);
        const results = await searchUsers(debouncedCollabSearchQuery);
        // Exclude self and already added collaborators
        const filteredResults = results.filter(u => u.id !== userProfile?.id && !collaborators.some(c => c.id === u.id));
        setCollabSearchResults(filteredResults);
        setIsSearchingCollabs(false);
      } else {
        setCollabSearchResults([]);
      }
    }
    searchForCollaborators();
  }, [debouncedCollabSearchQuery, userProfile?.id, collaborators]);

  const addCollaborator = (collabUser: User) => {
    if (collaborators.length < 1) { // Limit to 1 collaborator for now
        setCollaborators([...collaborators, collabUser]);
    }
    setCollabSearchQuery("");
    setCollabSearchResults([]);
    setIsCollabPopoverOpen(false);
  };

  const removeCollaborator = (collabUser: User) => {
    setCollaborators(collaborators.filter(c => c.id !== collabUser.id));
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
        toast({ title: "Please log in to create a post.", variant: "destructive" });
        return;
    }
    if (!fileType) return;

    setIsSubmitting(true);
    
    toast({
        title: "Post is uploading...",
        description: "You can navigate away, the upload will continue in the background.",
    });

    router.push("/feed");

    const backgroundUpload = async () => {
        try {
            const file = values.file as File;
            const hashtags = values.caption.match(/#\\w+/g) || [];
    
            const postId = await createPost({
                userId: userProfile.id,
                type: fileType,
                caption: values.caption,
                hashtags,
                tags: fileType === 'image' ? tags : [],
                collaboratorIds: collaborators.map(c => c.id),
            });
    
            const contentUrl = await uploadFile(file, `posts/${userProfile.id}/${postId}_${file.name}`);
            
            await updatePost(postId, {
                contentUrl,
                status: 'published'
            });

        } catch (error) {
            console.error("Error creating post in background:", error);
             toast({
                title: "Upload Failed",
                description: "There was an error uploading your post. Please try again.",
                variant: "destructive",
            });
        }
    };
    
    backgroundUpload();
  }
  
  if (loading) {
    return <Icons.spinner className="animate-spin h-8 w-8 mx-auto mt-24" />;
  }

  if (isGuest) {
      return <GuestPrompt />;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg h-96 md:h-[500px] relative">
        {preview ? (
            <div className="relative w-full h-full">
                {fileType === 'image' ? (
                    <>
                    <Image
                        src={preview}
                        alt="Post preview"
                        fill
                        className="object-contain rounded-md"
                    />
                    </>
                ) : (
                    <AspectRatio ratio={9 / 16} className="bg-muted rounded-md overflow-hidden w-full max-w-sm mx-auto">
                        <video
                            src={preview}
                            controls
                            className="w-full h-full object-contain"
                        />
                    </AspectRatio>
                )}
            </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Icons.image className="mx-auto h-12 w-12" />
            <p className="mt-2">Upload an image or video</p>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Media</FormLabel>
                <FormControl>
                  <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Caption</FormLabel>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Write a caption..."
                    className="resize-none min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <FormLabel>Collaborators</FormLabel>
            <div className="mt-2 space-y-2">
                {collaborators.map(collab => (
                    <div key={collab.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={collab.avatar} />
                                <AvatarFallback>{collab.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{collab.username}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCollaborator(collab)}>
                            <Icons.close className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {collaborators.length < 1 && (
                     <Popover open={isCollabPopoverOpen} onOpenChange={setIsCollabPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full">
                                <Icons.plus className="mr-2 h-4 w-4" /> Add Collaborator
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-2">
                                <p className="font-medium">Invite a collaborator</p>
                                <div className="relative">
                                    <Icons.search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search username..."
                                        value={collabSearchQuery}
                                        onChange={(e) => setCollabSearchQuery(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                {isSearchingCollabs ? (
                                    <div className="text-center p-4">
                                        <Icons.spinner className="animate-spin" />
                                    </div>
                                ) : collabSearchResults.length > 0 ? (
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {collabSearchResults.map(u => (
                                            <button 
                                                key={u.id} 
                                                type="button" 
                                                onClick={() => addCollaborator(u)}
                                                className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={u.avatar} />
                                                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : debouncedCollabSearchQuery && (
                                    <p className="text-sm text-center text-muted-foreground p-4">No users found.</p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
          </div>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
            {isSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Share Post
          </Button>
        </form>
      </Form>
    </div>
  );
}
