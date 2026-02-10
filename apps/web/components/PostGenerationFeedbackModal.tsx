"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { BACKEND_URL } from "@/app/config";
import { useAuth, useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const RATING_MAX = 5;
const POST_GENERATION_SOURCE = "post_generation";
export const POST_GENERATION_FEEDBACK_KEY = "purepromise_post_generation_feedback_given";

export function PostGenerationFeedbackModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { getToken } = useAuth();
  const { user } = useUser();

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    if (!userEmail?.trim()) {
      toast.error("Email is required. Please ensure you're signed in with an email.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const message = comment.trim()
        ? `Post-generation feedback\n\n${comment.trim()}`
        : "Post-generation feedback";
      const res = await fetch(`${BACKEND_URL}/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: userEmail.trim(),
          message,
          rating,
          source: POST_GENERATION_SOURCE,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Could not send feedback");
        return;
      }
      toast.success("Thank you for your feedback!");
      if (typeof window !== "undefined") {
        localStorage.setItem(POST_GENERATION_FEEDBACK_KEY, "true");
      }
      onOpenChange(false);
      setRating(0);
      setComment("");
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How did we do?</DialogTitle>
          <DialogDescription>
            Your image was generated. We&apos;d love to hear how it went.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Rate your experience</p>
            <div className="flex gap-1">
              {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      value <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="feedback-comment" className="text-sm font-medium">
              Anything else? (optional)
            </label>
            <Textarea
              id="feedback-comment"
              placeholder="Tell us more..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={submitting}
              maxLength={2000}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Maybe later
            </Button>
            <Button type="submit" disabled={submitting || rating < 1}>
              {submitting ? "Sending..." : "Send feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
