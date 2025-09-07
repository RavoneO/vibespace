
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { suggestHashtags } from "@/ai/flows/ai-suggested-hashtags";
import { generateCaption } from "@/ai/flows/ai-generated-caption";
import { createPost, updatePost } from "@/services/postService";
import { uploadFile } from "@/services/storageService";
import { useAuth } from "@/hooks/use-auth";

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
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: "",
      file: null,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("file", file);
      setFileType(file.type.startsWith('image') ? 'image' : 'video');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setMediaDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear previous suggestions when a new file is selected
      setSuggestedHashtags([]);
      setSuggestedCaptions([]);
    }
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
      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg h-96 md:h-full">
        {preview ? (
            fileType === 'image' ? (
                <Image
                    src={preview}
                    alt="Post preview"
                    width={400}
                    height={400}
                    className="max-h-full w-auto object-contain rounded-md"
                />
            ) : (
                <AspectRatio ratio={9 / 16} className="bg-muted rounded-md overflow-hidden w-full max-w-sm">
                    <video
                        src={preview}
                        controls
                        className="w-full h-full object-contain"
                    />
                </AspectRatio>
            )
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
