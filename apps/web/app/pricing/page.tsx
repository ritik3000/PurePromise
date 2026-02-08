import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <Coins className="h-16 w-16 mx-auto text-rose-500 dark:text-rose-400" />
        <h1 className="text-2xl font-bold">Add Credits</h1>
        <p className="text-muted-foreground">
          Credits are used for model training (10 credits) and image generation
          (1 credit per image). Purchase options will be available here soon.
        </p>
        <Button asChild variant="default">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
