import AppLayout from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { users, posts as allPosts } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = users.find((u) => u.username === params.username);
  const userPosts = allPosts.filter((p) => p.user.username === params.username);

  if (!user) {
    notFound();
  }

  const stats = [
    { label: "Posts", value: userPosts.length },
    { label: "Followers", value: "1.2k" },
    { label: "Following", value: "345" },
  ];

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
              <Avatar className="w-24 h-24 sm:w-36 sm:h-36 border-4 border-background ring-2 ring-primary">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-4xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                <p className="mt-3 text-sm max-w-prose">{user.bio}</p>
                <div className="mt-4 flex justify-center sm:justify-start">
                  <Button>Follow</Button>
                  <Button variant="outline" className="ml-2">Message</Button>
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex justify-around text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-bold text-lg">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts"><Icons.create className="mr-2 h-4 w-4" /> Posts</TabsTrigger>
              <TabsTrigger value="reels"><Icons.reels className="mr-2 h-4 w-4" /> Reels</TabsTrigger>
              <TabsTrigger value="tagged"><Icons.bookmark className="mr-2 h-4 w-4" /> Tagged</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="p-2 sm:p-4">
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
                {userPosts.map((post) => (
                  <div key={post.id} className="relative aspect-square w-full overflow-hidden rounded-md group">
                    <Image
                      src={post.contentUrl}
                      alt={post.caption}
                      fill
                      className="object-cover transition-all duration-300 group-hover:opacity-80 group-hover:scale-110"
                      data-ai-hint={post.dataAiHint}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <div className="flex items-center gap-1 font-bold">
                            <Icons.like className="h-5 w-5 fill-white" /> {post.likes}
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                            <Icons.comment className="h-5 w-5 fill-white" /> {post.comments.length}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="reels">
                <div className="text-center text-muted-foreground py-24">
                    <Icons.reels className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No reels yet</p>
                </div>
            </TabsContent>
            <TabsContent value="tagged">
                <div className="text-center text-muted-foreground py-24">
                    <Icons.bookmark className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No tagged posts</p>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AppLayout>
  );
}
