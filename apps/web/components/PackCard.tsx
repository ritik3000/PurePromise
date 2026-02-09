"use client";

import { BACKEND_URL } from "@/app/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { creditUpdateEvent } from "@/hooks/use-credits";
import Image from "next/image";
import toast from "react-hot-toast";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Coins, ImageIcon } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export interface TPack {
  id: string;
  name: string;
  imageUrl1: string;
  imageUrl2: string;
  imageUrl3?: string; // Optional third image
  imageUrl4?: string; // Optional fourth image
  description: string;
  category?: string;
  imagesCount?: number;
  createdAt?: string;
  /** Credit cost for this pack (from DB). 0 = free. */
  creditCost?: number;
}

export function PackCard(props: TPack & { coupleImageUrls: string[] }) {
  const { getToken } = useAuth();
  const canGenerate = props.coupleImageUrls.length >= 3 && props.coupleImageUrls.length <= 10;

  const images = [
    props.imageUrl1,
    props.imageUrl2,
    props.imageUrl3,
    props.imageUrl4,
  ].filter(Boolean);

  const handleGenerate = async () => {
    try {
      toast.promise(generatePack(), {
        loading: "Starting pack generation...",
        success: "Generation started! Images will be available in about 10 minutes on the My Images page.",
        error: "Failed to start generation",
      });
    } catch (error) {
      console.error("Failed to generate pack:", error);
    }
  };

  const generatePack = async () => {
    const token = await getToken();
    try {
      await axios.post(
        `${BACKEND_URL}/pack/generate`,
        {
          packId: props.id,
          imageUrls: props.coupleImageUrls,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      creditUpdateEvent.dispatchEvent(new Event("creditUpdate"));
    } catch (error: unknown) {
      const status = (error as { response?: { status: number; data?: { required?: number } } })?.response?.status;
      const data = (error as { response?: { data?: { required?: number } } })?.response?.data;
      if (status === 402) {
        const required = data?.required ?? 1;
        throw new Error(`Insufficient credits (need ${required}). Add credits to continue.`);
      }
      throw error;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="group h-full overflow-hidden border bg-card hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
            <CardHeader className="p-0">
              {images.length > 1 ? (
                // Render Carousel if there are more than 2 images
                <Carousel plugins={[
                  Autoplay({
                    delay: 4000,
                  }),
                ]} className="w-full">
                  <CarouselContent>
                    {images.map((imageUrl, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-square">
                          <Image
                            src={imageUrl!}
                            alt={`${props.name} preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              ) : (
                // Render a grid of images if there are 2 or fewer images
                <div className="grid grid-cols-1 bg-muted/20">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={imageUrl!}
                        alt={`${props.name} preview ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold tracking-tight text-lg">
                    {props.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {props.category && (
                      <Badge variant="secondary">
                        {props.category}
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <Coins className="w-3 h-3" />
                      {(props.creditCost ?? 0) === 0
                        ? "Free"
                        : `${props.creditCost} credits`}
                    </Badge>
                  </div>
                </div>
                {props.imagesCount && (
                  <Badge variant="outline" className="gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {props.imagesCount}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {props.description}
              </p>

              {props.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Added {new Date(props.createdAt).toLocaleDateString()}
                </p>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
              <Button
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 cursor-pointer"
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                Generate
              </Button>
            </CardFooter>
          </Card>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  );
}
