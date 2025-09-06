import { UploadReelForm } from "./upload-reel-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export default function UploadReelPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center p-4 border-b">
        <Button asChild variant="ghost" size="icon">
          <Link href="/reels">
            <Icons.back />
            <span className="sr-only">Back to reels</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Upload Reel</h1>
        <div className="w-9"></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <UploadReelForm />
        </div>
      </main>
    </div>
  );
}
