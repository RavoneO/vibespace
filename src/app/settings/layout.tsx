
import AppLayout from "@/components/app-layout";
import { SettingsNav } from "@/components/settings-nav";
import { Heading } from "@/components/ui/heading";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-10">
                <SettingsNav />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </main>
    </AppLayout>
  );
}
