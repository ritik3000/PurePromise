import { useState } from "react";
import { ArrowDown, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import { TImage } from "./Camera";
import { cn } from "@/lib/utils";

interface ImageCardProps extends TImage {
  onClick: () => void;
}

const CARD_MIN_HEIGHT = 300;

export function ImageCard({ id, status, imageUrl, onClick }: ImageCardProps) {
  const isGenerated = status === "Generated";
  const isPending = status === "Pending";
  const isFailed = status === "Failed";
  const [loaded, setLoaded] = useState(false);

  if (isPending) {
    return (
      <div
        className={cn(
          "group relative rounded-none overflow-hidden max-w-[400px]",
          "flex flex-col items-center justify-center gap-3",
          "bg-muted/50 border border-border/50 rounded-lg"
        )}
        style={{ minHeight: CARD_MIN_HEIGHT }}
      >
        <Skeleton className="absolute inset-0 rounded-lg" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Generating...</p>
          <p className="text-xs text-muted-foreground">This may take a few minutes</p>
        </div>
      </div>
    );
  }

  if (!isGenerated || !imageUrl) return null;

  return (
    <div onClick={onClick} className="group relative rounded-none overflow-hidden max-w-[400px] cursor-zoom-in">
      <div className="flex gap-4 min-h-32">
        <Image
          key={id}
          src={imageUrl}
          alt="Generated image"
          width={400}
          height={500}
          className="w-full"
          priority
        />
      </div>
      <div className="opacity-0 absolute transition-normal duration-200 group-hover:opacity-100 flex items-center justify-between bottom-0 left-0 right-0 p-4 bg-opacity-70 text-white line-clamp-1 ">
        <p>Generated image</p>
        <span className="flex items-center justify-between bg-primary-foreground text-muted-foreground rounded-md px-2 py-1">
          <ArrowDown />
        </span>
      </div>
    </div>
  );
}

export function ImageCardSkeleton() {
  return (
    <div className="rounded-none mb-4 overflow-hidden max-w-[400px] cursor-pointer">
      <div className="flex gap-4 min-h-32">
        <Skeleton className={`w-full h-[300px] rounded-none`} />
      </div>
    </div>
  );
}