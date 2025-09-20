
import AppLayout from "@/components/app-layout";
import { Heading } from "@/components/ui/heading";

export default function PaymentsSettingsPage() {
  return (
    <AppLayout>
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Heading title="Payment Methods" description="Manage your payment methods." />
        {/* I will add the UI for adding and listing payment methods here later */}
      </main>
    </AppLayout>
  );
}
