
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "use-debounce";

import { suggestHashtags, generateCaption, detectObjectsInImage } from "@/services/aiService";
import type { DetectObjectsOutput } from "@/ai/flows/ai-object-detection";
import { createPost, updatePost } from "@/services/postService";
import { uploadFile } from "@/services/storageService";
import { useAuth } from "@/hooks/use-auth";
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
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-center">Create an Account to Post</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">You need to be logged in to create a post and share it with the community.</p>
                <div className="flex gap-4 justify-center">
                    <Button asChild>
                        <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function CreatePostForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaDataUri, setMediaDataUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New states for object detection and tagging
  const [detectedObjects, setDetectedObjects] = useState<DetectObjectsOutput['objects'] | []>([]);
  const [isDetecting, setIsDetecting] = useState(false);
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

  const resetAiFeatures = useCallback(() => {
    setSuggestedHashtags([]);
    setSuggestedCaptions([]);
    setDetectedObjects([]);
    setTags([]);
    setIsDetecting(false);
  }, []);

  const handleDetectObjects = useCallback(async (dataUri: string) => {
    setIsDetecting(true);
    setDetectedObjects([]);
    try {
        const result = await detectObjectsInImage({ mediaDataUri: dataUri });
        setDetectedObjects(result.objects);
    } catch (error) {
        console.error("Error detecting objects:", error);
        toast({
            title: "Object Detection Failed",
            description: "Could not analyze the image at this time.",
            variant: "destructive",
        });
    } finally {
        setIsDetecting(false);
    }
  }, [toast]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("file", file);
      const currentFileType = file.type.startsWith('image') ? 'image' : 'video';
      setFileType(currentFileType);
      
      resetAiFeatures();

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setMediaDataUri(result);

        if (currentFileType === 'image') {
          handleDetectObjects(result);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [form, resetAiFeatures, handleDetectObjects]);

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


  const handleSuggestHashtags = async () => {
    if (!mediaDataUri) {
        toast({
            title: "No media selected",
            description: "Please upload an image or video to get hashtag suggestions.",
            variant: "destructive",
        });
        return;
    }

    setIsSuggesting(true);
    setSuggestedHashtags([]);

    try {
        const result = await suggestHashtags({
            mediaDataUri: mediaDataUri,
            description: form.getValues("caption"),
        });
        setSuggestedHashtags(result.hashtags);
    } catch (error) {
        console.error("Error suggesting hashtags:", error);
        toast({
            title: "AI Suggestion Failed",
            description: "Could not get hashtag suggestions at this time. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!mediaDataUri) {
      toast({
        title: 'No media selected',
        description: 'Please upload an image to get caption suggestions.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setSuggestedCaptions([]);
    try {
      const result = await generateCaption({
        mediaDataUri: mediaDataUri,
      });
      setSuggestedCaptions(result.captions);
    } catch (error) {
      console.error('Error generating captions:', error);
      toast({
        title: 'AI Generation Failed',
        description: 'Could not get caption suggestions at this time. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addHashtagToCaption = (hashtag: string) => {
    const currentCaption = form.getValues("caption");
    form.setValue("caption", `${currentCaption} ${hashtag}`.trim());
  }

  const useSuggestedCaption = (caption: string) => {
    form.setValue("caption", caption);
  }

  // Collaborator search logic
  useEffect(() => {
    async function searchForCollaborators() {
      if (debouncedCollabSearchQuery) {
        setIsSearchingCollabs(true);
        const results = await searchUsers(debouncedCollabSearchQuery);
        // Exclude self and already added collaborators
        const filteredResults = results.filter(u => u.id !== user?.uid && !collaborators.some(c => c.id === u.id));
        setCollabSearchResults(filteredResults);
        setIsSearchingCollabs(false);
      } else {
        setCollabSearchResults([]);
      }
    }
    searchForCollaborators();
  }, [debouncedCollabSearchQuery, user?.uid, collaborators]);

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
    if (!user) {
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
            const hashtags = values.caption.match(/#\w+/g) || [];
    
            const postId = await createPost({
                userId: user.uid,
                type: fileType,
                caption: values.caption,
                hashtags,
                tags: fileType === 'image' ? tags : [],
                collaboratorIds: collaborators.map(c => c.id),
            });
    
            const contentUrl = await uploadFile(file, `posts/${user.uid}/${postId}_${file.name}`);
            
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
                    {isDetecting && (
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                            <div className="text-white text-center">
                                <Icons.sparkles className="mx-auto h-8 w-8 animate-spin" />
                                <p>Finding objects...</p>
                            </div>
                        </div>
                    )}
                    {detectedObjects.map(({ box, label }, index) => {
                         const tagged = tags.find(t => t.box.toString() === box.toString());
                         return(
                            <Popover key={index} onOpenChange={(open) => {
                                if (!open) {
                                    setActiveTaggingBox(null);
                                    setTagInput("");
                                }
                             }}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "absolute border-2 hover:border-blue-400 focus:border-blue-400 focus:outline-none transition-all",
                                            tagged ? "border-blue-500 bg-blue-500/30" : "border-dashed border-white/80 hover:bg-white/20",
                                        )}
                                        style={{
                                            left: `${box[0] * 100}%`,
                                            top: `${box[1] * 100}%`,
                                            width: `${(box[2] - box[0]) * 100}%`,
                                            height: `${(box[3] - box[1]) * 100}%`,
                                        }}
                                        onClick={() => setActiveTaggingBox({box, label})}
                                    >
                                        <span className="absolute -top-6 left-0 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full capitalize">{tagged ? tagged.text : label}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Tag "{label}"</p>
                                        <Input 
                                            placeholder="Add a tag..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                        />
                                        <Button onClick={handleSaveTag} size="sm" className="w-full">Save Tag</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                         )
                    })}
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
                  <Popover>
                    <PopoverTrigger asChild>
                       <Button type="button" size="sm" variant="ghost" disabled={isGenerating || !mediaDataUri || isSubmitting}>
                         {isGenerating ? <Icons.spinner className="animate-spin" /> : <Icons.sparkles className="text-accent" />}
                          Generate with AI
                       </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      {suggestedCaptions.length > 0 ? (
                        <div className="space-y-2">
                           <p className="font-medium text-sm">AI Suggestions</p>
                           {suggestedCaptions.map((caption, i) => (
                               <div key={i}>
                                   <button type="button" onClick={() => useSuggestedCaption(caption)} className="text-left text-sm p-2 rounded-md hover:bg-muted w-full">
                                       {caption}
                                   </button>
                                   {i < suggestedCaptions.length -1 && <Separator />}
                               </div>
                           ))}
                        </div>
                      ) : (
                         <div className="text-center p-4">
                            <p className="text-sm mb-4">Click below to generate caption ideas for your image.</p>
                            <Button type="button" onClick={handleGenerateCaptions} disabled={isGenerating}>
                                {isGenerating ? <Icons.spinner className="animate-spin" /> : "Generate"}
                            </Button>
                         </div>
                      )}
                    </PopoverContent>
                  </Popover>
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

          <div>
             <Button type="button" variant="outline" onClick={handleSuggestHashtags} disabled={isSuggesting || !mediaDataUri || isSubmitting}>
                {isSuggesting ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Icons.sparkles className="mr-2 h-4 w-4 text-accent" />
                )}
                Suggest Hashtags with AI
            </Button>
            {suggestedHashtags.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-medium mb-2">AI Hashtag Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedHashtags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-accent/20" onClick={() => addHashtagToCaption(tag)}>
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
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
