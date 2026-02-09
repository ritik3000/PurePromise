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
import { creditUpdateEvent } from "@/hooks/use-credits";

const MIN_IMAGES = 3;
const MAX_IMAGES = 10;

/** Reference sample sets for Generate images: 1 face, 2 faces, 3 faces */
const REFERENCE_SAMPLE_SETS = [
  {
    label: "1 face – upload photos with 1 face",
    urls: ["https://purepromise.s3.ap-south-1.amazonaws.com/models/single1.jpg"],
  },
  {
    label: "2 faces – upload photos with 2 faces",
    urls: ["https://purepromise.s3.ap-south-1.amazonaws.com/models/single2.avif"],
  },
  {
    label: "3 faces – upload photos with 3 faces",
    urls: ["https://purepromise.s3.ap-south-1.amazonaws.com/models/single3.jpg"],
  },
];

export function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { getToken } = useAuth();

  const canGenerate = prompt.trim().length > 0 && imageUrls.length >= MIN_IMAGES && imageUrls.length <= MAX_IMAGES;

  const generateImage = async () => {
    const token = await getToken();
    await axios.post(
      `${BACKEND_URL}/ai/generate-from-images`,
      { prompt: prompt.trim(), imageUrls },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    creditUpdateEvent.dispatchEvent(new Event("creditUpdate"));
    setPrompt("");
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    try {
      await toast.promise(generateImage(), {
        loading: "Starting image generation...",
        success: "Generation started! Images will be available in about 10 minutes on the My Images page.",
        error: (err: unknown) => {
          const status = (err as { response?: { status: number; data?: { required?: number } } })?.response?.status;
          const data = (err as { response?: { data?: { required?: number } } })?.response?.data;
          if (status === 402) {
            const required = data?.required ?? 100;
            return `Insufficient credits (need ${required}). Add credits to continue.`;
          }
          return "Failed to start generation";
        },
      }, { success: { duration: 5000 } });
    } catch {
      // Error already shown by toast.promise
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
          description={`Upload 3–10 reference images. Stored individually (no zip).`}
          hint="Make sure every photo includes all intended faces, and upload multiple images for the best outcome."
          showFaceNotice={false}
          samplePhotoSets={REFERENCE_SAMPLE_SETS}
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
            25 credits will be deducted per image
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !canGenerate}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Generate Image <Sparkles size={24} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
