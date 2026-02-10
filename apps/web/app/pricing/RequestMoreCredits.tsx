"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { BACKEND_URL } from "@/app/config";

export function RequestMoreCredits() {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { getToken } = useAuth();

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to request more credits.");
        return;
      }
      const res = await fetch(`${BACKEND_URL}/credits/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phone.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Something went wrong. Please try again.");
        return;
      }
      toast.success("Request successfully recorded. We'll be in touch.");
      setPhone("");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleRequest} className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[200px]">
      <div className="space-y-2 text-left">
        <Label htmlFor="credit-request-phone">Phone number</Label>
        <Input
          id="credit-request-phone"
          type="tel"
          placeholder="+1 234 567 8900"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
          className="bg-background"
        />
      </div>
      <Button
        type="submit"
        variant="default"
        disabled={submitting || !phone.trim()}
      >
        {submitting ? "Submitting..." : "Request more credits"}
      </Button>
    </form>
  );
}
