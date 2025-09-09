
import AppLayout from "@/components/app-layout";
import { SearchUsers } from "./search-users";

export default function SearchPage() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90 mb-6">
            Search
          </h1>
          <SearchUsers />
        </div>
      </main>
    </AppLayout>
  );
}
