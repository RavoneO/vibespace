
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const formSchema = z.object({
  caption: z.string().max(1000, "Caption is too long."),
  file: z.any().refine((file) => file, "Please upload a video."),
});

export function UploadReelForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
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
    if (file && file.type.startsWith("video/")) {
      form.setValue("file", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a video file.",
        variant: "destructive",
      });
      form.setValue("file", null);
      setPreview(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
        toast({ title: "Please log in to upload a reel.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    toast({
        title: "Reel is uploading...",
        description: "You can navigate away, the upload will continue in the background.",
    });

    // Navigate away immediately.
    router.push("/reels");
    
    const backgroundUpload = async () => {
        const file = values.file as File;
        const hashtags = values.caption.match(/#\w+/g) || [];
        try {
            const postId = await createPost({
                userId: user.uid,
                type: 'video',
                caption: values.caption,
                hashtags,
            });
    
            const contentUrl = await uploadFile(file, `reels/${user.uid}/${postId}_${file.name}`);
            
            await updatePost(postId, {
                contentUrl,
                status: 'published'
            } as any);

        } catch (error) {
            console.error("Error creating reel in background:", error);
            // Since the user has already navigated away, a toast here might be confusing.
        }
    };

    // Start the background upload but don't wait for it to finish.
    backgroundUpload();

    // Set submitting to false immediately so the UI is not blocked.
    setIsSubmitting(false);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
        {preview ? (
            <AspectRatio ratio={9 / 16} className="bg-muted rounded-md overflow-hidden">
                <video
                    src={preview}
                    controls
                    className="w-full h-full object-contain"
                />
            </AspectRatio>
        ) : (
          <div className="text-center text-muted-foreground h-full flex flex-col justify-center">
            <Icons.reels className="mx-auto h-12 w-12" />
            <p className="mt-2">Upload a video</p>
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
                <FormLabel>Video File</FormLabel>
                <FormControl>
                  <input type="file" accept="video/*" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
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
                    placeholder="Write a caption for your reel..."
                    className="resize-none min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
             {isSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Share Reel
          </Button>
        </form>
      </Form>
    </div>
  );
}
