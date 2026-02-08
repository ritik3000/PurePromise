"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { UploadCoupleImages } from "./UploadCoupleImages";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import CustomLabel from "./ui/customLabel";
import { GlowEffect } from "./GlowEffect";
import { creditUpdateEvent } from "@/hooks/use-credits";

const MIN_IMAGES = 5;
const MAX_IMAGES = 10;

export function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { getToken } = useAuth();

  const canGenerate = prompt.trim().length > 0 && imageUrls.length >= MIN_IMAGES && imageUrls.length <= MAX_IMAGES;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    try {
      const token = await getToken();
      await axios.post(
        `${BACKEND_URL}/ai/generate-from-images`,
        { prompt: prompt.trim(), imageUrls },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      creditUpdateEvent.dispatchEvent(new Event("creditUpdate"));
      toast.success("Image generation started!");
      setPrompt("");
    } catch (error: unknown) {
      const status = (error as { response?: { status: number; data?: { message?: string; required?: number } } })?.response?.status;
      const data = (error as { response?: { data?: { message?: string; required?: number } } })?.response?.data;
      if (status === 402) {
        const required = data?.required ?? 100;
        toast.error(`Insufficient credits (need ${required}). Add credits to continue.`);
      } else {
        toast.error("Failed to generate image");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-4">
        <UploadCoupleImages
          imageUrls={imageUrls}
          onImageUrlsChange={setImageUrls}
          minImages={MIN_IMAGES}
          maxImages={MAX_IMAGES}
          title="Upload reference images"
          description={`Upload 5–10 reference images. Stored individually (no zip).`}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-full"
        >
          <CustomLabel label="Enter your prompt here..." />
          <Textarea
            className="w-full min-h-24"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </motion.div>

        <div className="flex flex-col items-end gap-2 pt-4">
          <p className="text-sm text-muted-foreground">
            100 credits will be deducted per image
          </p>
          <div className="relative">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !canGenerate}
              variant={"outline"}
              className="relative z-20 cursor-pointer"
            >
              Generate Image <Sparkles size={24} />
            </Button>
            {canGenerate && (
              <GlowEffect
                colors={["#FF5733", "#33FF57", "#3357FF", "#F1C40F"]}
                mode="colorShift"
                blur="soft"
                duration={3}
                scale={0.9}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
