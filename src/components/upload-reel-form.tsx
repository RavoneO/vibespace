
"use client";

import { useState, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const formSchema = z.object({
  caption: z.string().max(1000, "Caption is too long."),
  file: z.any().refine((file) => file, "Please upload a video."),
});


function GuestPrompt() {
    const router = useRouter();
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-center">Create an Account to Upload</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">You need to be logged in to upload a reel for the community to see.</p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => router.push('/login')}>Log In</Button>
                    <Button onClick={() => router.push('/signup')} variant="secondary">Sign Up</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function UploadReelForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, loading, isGuest } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } else if (file) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a video file.",
        variant: "destructive",
      });
      if(event.target) event.target.value = "";
      form.resetField("file");
      setPreview(null);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
        toast({ title: "Please log in to upload a reel.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    toast({
        title: "Reel is uploading...",
        description: "You can navigate away, the upload will continue in the background.",
    });

    router.push("/reels");
    
    const backgroundUpload = async () => {
        const file = values.file as File;
        const hashtags = values.caption.match(/#\w+/g) || [];
        let postId = '';
        try {
            postId = await createPost({
                userId: userProfile.id,
                type: 'video',
                caption: values.caption,
                hashtags,
                isReel: true,
            });
    
            const contentUrl = await uploadFile(file, `reels/${userProfile.id}/${postId}_${file.name}`);
            
            await updatePost(postId, {
                contentUrl,
                status: 'published'
            });

        } catch (error) {
            console.error("Error creating reel in background:", error);
            if (postId) {
                await updatePost(postId, { status: 'failed' });
            }
        }
    };

    backgroundUpload();
  }

  if (loading) {
    return <Icons.spinner className="animate-spin h-8 w-8 mx-auto mt-24" />;
  }

  if (isGuest) {
      return <GuestPrompt />
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
       <div 
        className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg h-96 md:h-[500px] relative cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleUploadAreaClick}
      >
        {preview ? (
            <div className="relative w-full h-full">
              <AspectRatio ratio={9 / 16} className="bg-black rounded-md overflow-hidden">
                  <video
                      src={preview}
                      controls
                      className="w-full h-full object-contain"
                  />
              </AspectRatio>
              <div className="absolute bottom-4 right-4 z-10">
                  <Button type="button" onClick={(e) => { e.stopPropagation(); handleUploadAreaClick(); }}>
                      Change Video
                  </Button>
              </div>
            </div>
        ) : (
          <div className="text-center text-muted-foreground h-full flex flex-col justify-center">
            <Icons.reels className="mx-auto h-12 w-12" />
            <p className="mt-2">Click or drag to upload a video</p>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel>Video File</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleFileChange} 
                    ref={fileInputRef} 
                  />
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
