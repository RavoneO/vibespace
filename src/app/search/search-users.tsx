"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { users } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function SearchUsers() {
  const [query, setQuery] = useState("");

  const filteredUsers =
    query === ""
      ? []
      : users.filter(
          (user) =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.username.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div>
      <div className="relative">
        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for users..."
          className="w-full pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-6 space-y-4">
        {query && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <Link href={`/profile/${user.username}`}>
                  <div className="flex items-center gap-4 cursor-pointer">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </Link>
                <Button size="sm">Follow</Button>
              </div>
            ))}
          </div>
        )}

        {query && filteredUsers.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <p>No users found for "{query}"</p>
          </div>
        )}

        {!query && (
            <div className="text-center text-muted-foreground py-10">
                <Icons.search className="mx-auto h-12 w-12" />
                <p className="mt-4 font-semibold">Find new people</p>
                <p className="text-sm">Search by name or username.</p>
            </div>
        )}
      </div>
    </div>
  );
}
