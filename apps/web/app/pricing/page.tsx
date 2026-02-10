import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Coins } from "lucide-react";
import { RequestMoreCredits } from "./RequestMoreCredits";

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
      
          Out of credits?<br></br> Request for
          more by clicking below.
        </p>
        <RequestMoreCredits />
      </div>
    </div>
  );
}
