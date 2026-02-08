"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BACKEND_URL } from "@/app/config";

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter your email and message.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim() || undefined,
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Could not send feedback",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Thank you",
        description: "We've received your feedback and will get back to you soon.",
      });
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to send. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-phone">Phone (optional)</Label>
        <Input
          id="contact-phone"
          type="tel"
          placeholder="+1 234 567 8900"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          placeholder="Your feedback or question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          disabled={submitting}
          maxLength={5000}
          className="resize-y bg-background"
        />
        <p className="text-xs text-muted-foreground">
          {message.length}/5000 characters
        </p>
      </div>
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Sending..." : "Send feedback"}
      </Button>
    </form>
  );
}
