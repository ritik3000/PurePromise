"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { BACKEND_URL, S3_PUBLIC_URL } from "@/app/config";
import toast from "react-hot-toast";
import Image from "next/image";
import { X } from "lucide-react";

const DEFAULT_MAX_IMAGES = 10;

/** Sample couple photos (clear faces) to show as upload examples */
const SAMPLE_COUPLE_PHOTOS = [
"https://purepromise.s3.ap-south-1.amazonaws.com/models/ankitindu1.jpeg",
"https://purepromise.s3.ap-south-1.amazonaws.com/models/ankitindu2.jpeg",
"https://purepromise.s3.ap-south-1.amazonaws.com/models/ak1.jpeg"
];

export function UploadCoupleImages({
  imageUrls,
  onImageUrlsChange,
  minImages = 0,
  maxImages = DEFAULT_MAX_IMAGES,
  title = "Upload couple images",
  description,
  hint,
  showFaceNotice = true,
  samplePhotoSets,
}: {
  imageUrls: string[];
  onImageUrlsChange: (urls: string[]) => void;
  /** Minimum required images (e.g. 3 for generate-from-images). Default 0. */
  minImages?: number;
  /** Maximum allowed images. Default 10. */
  maxImages?: number;
  title?: string;
  description?: string;
  /** Optional extra line (e.g. for generate-images: include-all-faces tip). */
  hint?: string;
  /** Show the red "couple faces only" notice. Default true (packs); set false for generate-images tab. */
  showFaceNotice?: boolean;
  /** Custom sample sets with labels (e.g. "1 face", "2 faces", "3 faces"). When set, replaces the default couple samples. */
  samplePhotoSets?: { label: string; urls: string[] }[];
}) {
  const { getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "fetching-urls" | "uploading">("idle");

  const handleUpload = useCallback(
    async (files: File[]) => {
      const toAdd = files.slice(0, maxImages - imageUrls.length);
      if (toAdd.length === 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const token = await getToken();
        // Phase 1: fetch presigned URLs first
        setUploadPhase("fetching-urls");
        const res = await axios.post<{ uploadId: string; keys: { url: string; key: string }[] }>(
          `${BACKEND_URL}/presigned-url/images`,
          { count: toAdd.length },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { keys } = res.data;

        // Phase 2: then upload each file to S3 using the presigned URLs
        setUploadPhase("uploading");
        const newUrls: string[] = [];
        for (let i = 0; i < toAdd.length; i++) {
          const file = toAdd[i];
          const entry = keys[i];
          if (!entry || !file) continue;
          const { url, key } = entry;
          await axios.put(url, file, {
            headers: { "Content-Type": file.type || "image/jpeg" },
          });
          newUrls.push(`${S3_PUBLIC_URL}/${key}`);
          setUploadProgress(Math.round(((i + 1) / toAdd.length) * 100));
        }
        onImageUrlsChange([...imageUrls, ...newUrls]);
        toast.success(`Uploaded ${newUrls.length} image(s)`);
      } catch (err) {
        console.error(err);
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadPhase("idle");
      }
    },
    [imageUrls, onImageUrlsChange, getToken, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (files.length) handleUpload(files);
    },
    [handleUpload]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeImage = (index: number) => {
    const next = imageUrls.filter((_, i) => i !== index);
    onImageUrlsChange(next);
  };

  return (
    <Card className="w-full rounded-lg border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {description ??
            (minImages > 0
              ? `Minimum ${minImages}, up to ${maxImages} images. Stored individually (no zip).`
              : `Up to ${maxImages} images. Stored individually (no zip).`)}
        </CardDescription>
        {showFaceNotice && (
          <p className="text-sm text-red-600 dark:text-red-500 mt-1.5 font-medium">
            Only upload photos in which faces of the couple are clearly visible. No other faces should be visible.
          </p>
        )}
        {hint && (
          <p className="text-sm text-red-600 dark:text-red-500 mt-1.5 font-bold">{hint}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            {samplePhotoSets ? "Reference: upload photos like these for each case" : "Sample photos (good examples)"}
          </p>
          {samplePhotoSets ? (
            <div className="space-y-2">
              {samplePhotoSets.map((set, setIdx) => (
                <div key={setIdx} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground shrink-0 w-24 sm:w-28">
                    {set.label}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {set.urls.map((src, i) => (
                      <div
                        key={src}
                        className="relative aspect-square w-14 sm:w-16 rounded-md overflow-hidden border border-border bg-muted shrink-0"
                      >
                        <Image
                          src={src}
                          alt={`${set.label} sample ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {SAMPLE_COUPLE_PHOTOS.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-square w-16 sm:w-20 rounded-md overflow-hidden border border-border bg-muted shrink-0"
                >
                  <Image
                    src={src}
                    alt={`Sample couple photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all",
            isUploading && "pointer-events-none opacity-80"
          )}
        >
          {isUploading ? (
            <div className="w-full max-w-xs space-y-2 text-center">
              <Progress value={uploadPhase === "uploading" ? uploadProgress : 10} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop or browse ({imageUrls.length}/{maxImages})
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = () => {
                    if (input.files?.length)
                      handleUpload(Array.from(input.files));
                  };
                  input.click();
                }}
                disabled={imageUrls.length >= maxImages}
              >
                Browse
              </Button>
            </>
          )}
        </div>
        {minImages > 0 && (
          <p className="text-xs text-muted-foreground">
            * minimum of {minImages} images required

          </p>
        )}
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {imageUrls.map((url, index) => (
              <div key={url} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={url.startsWith("http")}
                  sizes="120px"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
