
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { suggestHashtags } from "@/ai/flows/ai-suggested-hashtags";
import { createPost } from "@/services/postService";
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

const formSchema = z.object({
  caption: z.string().max(2200, "Caption is too long."),
  file: z.any().refine((file) => file, "Please upload an image or video."),
});

export function CreatePostForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaDataUri, setMediaDataUri] = useState<string | null>(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setMediaDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSuggestedHashtags([]);
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

  const addHashtagToCaption = (hashtag: string) => {
    const currentCaption = form.getValues("caption");
    form.setValue("caption", `${currentCaption} ${hashtag}`.trim());
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
        toast({ title: "Please log in to post.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        const file = values.file as File;
        const fileType = file.type.startsWith('image') ? 'image' : 'video';
        
        const contentUrl = await uploadFile(file, `posts/${user.uid}/${Date.now()}_${file.name}`);
        
        const hashtags = values.caption.match(/#\w+/g) || [];

        await createPost({
            userId: user.uid,
            type: fileType,
            contentUrl,
            caption: values.caption,
            hashtags,
        });

        toast({
            title: "Post Submitted!",
            description: "Your post is now live.",
        });

        router.push("/");

    } catch (error) {
        console.error("Error creating post:", error);
        toast({
            title: "Post Creation Failed",
            description: "Could not create your post at this time. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg h-96 md:h-full">
        {preview ? (
          <Image
            src={preview}
            alt="Post preview"
            width={400}
            height={400}
            className="max-h-full w-auto object-contain rounded-md"
          />
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
                <FormLabel>Caption</FormLabel>
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
                    <p className="text-sm font-medium mb-2">AI Suggestions:</p>
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
