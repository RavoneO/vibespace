
import { CreatePostForm } from "@/components/create-post-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export default function CreatePostPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center p-4 border-b">
        <Button asChild variant="ghost" size="icon">
          <Link href="/feed">
            <Icons.back />
            <span className="sr-only">Back to feed</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Create New Post</h1>
        <div className="w-9"></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <CreatePostForm />
        </div>
      </main>
    </div>
  );
}

    