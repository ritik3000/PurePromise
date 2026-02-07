import { fal } from "@fal-ai/client";
import express from "express";
import {
  TrainModel,
  GenerateImage,
  GenerateImagesFromPack,
  GeneratePackWithImages,
} from "common/types";
import { prismaClient } from "db";
import { S3Client } from "bun";
import { FalAIModel } from "./models/FalAIModel";
import cors from "cors";
import { authMiddleware } from "./middleware";
import dotenv from "dotenv";

import { router as webhookRouter } from "./routes/webhook.routes";

dotenv.config();

const PORT = process.env.PORT || 8080;

const falAiModel = new FalAIModel();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://fe-staging.dxdev.space"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/pre-signed-url", async (req, res) => {
  const key = `models/${Date.now()}_${Math.random()}.zip`;
  const url = S3Client.presign(key, {
    method: "PUT",
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.ENDPOINT,
    bucket: process.env.BUCKET_NAME,
    expiresIn: 60 * 5,
    type: "application/zip",
  });

  res.json({
    url,
    key,
  });
});

/** Presigned URLs for couple images (non-zipped, up to 10). Key: couple-images/{userId}/{uploadId}/{index}.{ext} */
app.post("/presigned-url/images", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const uploadId = (req.body?.uploadId as string) || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const count = Math.min(Math.max(Number(req.body?.count) || 1, 1), 10);
  const keys: { url: string; key: string }[] = [];
  for (let i = 0; i < count; i++) {
    const key = `couple-images/${userId}/${uploadId}/${i}.jpg`;
    const url = S3Client.presign(key, {
      method: "PUT",
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      endpoint: process.env.ENDPOINT,
      bucket: process.env.BUCKET_NAME,
      expiresIn: 60 * 5,
      type: "image/jpeg",
    });
    keys.push({ url, key });
  }
  res.json({ uploadId, keys });
});

app.post("/ai/training", authMiddleware, async (req, res) => {
  try {
    const parsedBody = TrainModel.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(411).json({
        message: "Input incorrect",
        error: parsedBody.error,
      });
      return;
    }

    const { request_id, response_url } = await falAiModel.trainModel(
      parsedBody.data.zipUrl,
      parsedBody.data.name
    );

    const data = await prismaClient.model.create({
      data: {
        name: parsedBody.data.name,
        type: parsedBody.data.type,
        age: parsedBody.data.age,
        ethinicity: parsedBody.data.ethinicity,
        eyeColor: parsedBody.data.eyeColor,
        bald: parsedBody.data.bald,
        userId: req.userId!,
        zipUrl: parsedBody.data.zipUrl,
        falAiRequestId: request_id,
      },
    });

    res.json({
      modelId: data.id,
    });
  } catch (error) {
    console.error("Error in /ai/training:", error);
    res.status(500).json({
      message: "Training failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/ai/generate", authMiddleware, async (req, res) => {
  const parsedBody = GenerateImage.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(411).json({});
    return;
  }

  const model = await prismaClient.model.findUnique({
    where: {
      id: parsedBody.data.modelId,
    },
  });

  if (!model || !model.tensorPath) {
    res.status(411).json({
      message: "Model not found",
    });
    return;
  }

  const { request_id, response_url } = await falAiModel.generateImage(
    parsedBody.data.prompt,
    model.tensorPath
  );

  const data = await prismaClient.outputImages.create({
    data: {
      prompt: parsedBody.data.prompt,
      userId: req.userId!,
      modelId: parsedBody.data.modelId,
      imageUrl: "",
      falAiRequestId: request_id,
    },
  });

  res.json({
    imageId: data.id,
  });
});

app.post("/pack/generate", authMiddleware, async (req, res) => {
  const withImages = GeneratePackWithImages.safeParse(req.body);
  if (withImages.success) {
    const { packId, imageUrls } = withImages.data;
    const prompts = await prismaClient.packPrompts.findMany({
      where: { packId },
    });
    if (prompts.length === 0) {
      res.status(411).json({ message: "Pack has no prompts" });
      return;
    }
    const requestIds: { request_id: string }[] = await Promise.all(
      prompts.map((p) => falAiModel.generateImageFromReference(p.prompt, imageUrls))
    );
    const images = await prismaClient.outputImages.createManyAndReturn({
      data: prompts.map((prompt, index) => ({
        prompt: prompt.prompt,
        userId: req.userId!,
        imageUrl: "",
        falAiRequestId: requestIds[index].request_id,
      })) as never,
    });
    res.json({ images: images.map((i) => i.id) });
    return;
  }

  const parsedBody = GenerateImagesFromPack.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(411).json({
      message: "Input incorrect",
    });
    return;
  }

  const prompts = await prismaClient.packPrompts.findMany({
    where: {
      packId: parsedBody.data.packId,
    },
  });

  const model = await prismaClient.model.findFirst({
    where: {
      id: parsedBody.data.modelId,
    },
  });

  if (!model) {
    res.status(411).json({
      message: "Model not found",
    });
    return;
  }

  const requestIds: { request_id: string }[] = await Promise.all(
    prompts.map((prompt) =>
      falAiModel.generateImage(prompt.prompt, model.tensorPath!)
    )
  );

  const images = await prismaClient.outputImages.createManyAndReturn({
    data: prompts.map((prompt, index) => ({
      prompt: prompt.prompt,
      userId: req.userId!,
      modelId: parsedBody.data.modelId,
      imageUrl: "",
      falAiRequestId: requestIds[index].request_id,
    })),
  });

  res.json({
    images: images.map((image) => image.id),
  });
});

app.get("/pack/bulk", async (req, res) => {
  const packs = await prismaClient.packs.findMany({});

  res.json({
    packs,
  });
});

app.get("/image/bulk", authMiddleware, async (req, res) => {
  const ids = req.query.ids as string[];
  const limit = (req.query.limit as string) ?? "100";
  const offset = (req.query.offset as string) ?? "0";

  const imagesData = await prismaClient.outputImages.findMany({
    where: {
      id: { in: ids },
      userId: req.userId!,
      status: {
        not: "Failed",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: parseInt(offset),
    take: parseInt(limit),
  });

  res.json({
    images: imagesData,
  });
});

app.get("/models", authMiddleware, async (req, res) => {
  const models = await prismaClient.model.findMany({
    where: {
      OR: [{ userId: req.userId }, { open: true }],
    },
  });

  res.json({
    models,
  });
});

app.post("/fal-ai/webhook/train", async (req, res) => {
  console.log("====================Received training webhook====================");
  console.log("Received training webhook:", req.body);
  const requestId = req.body.request_id as string;

  // First find the model to get the userId
  const model = await prismaClient.model.findFirst({
    where: {
      falAiRequestId: requestId,
    },
  });

  console.log("Found model:", model);

  if (!model) {
    console.error("No model found for requestId:", requestId);
    res.status(404).json({ message: "Model not found" });
    return;
  }

  // Handle error case
  if (req.body.status === "ERROR") {
    console.error("Training error:", req.body.error);
    await prismaClient.model.updateMany({
      where: {
        falAiRequestId: requestId,
      },
      data: {
        trainingStatus: "Failed",
      },
    });
    
    res.json({
      message: "Error recorded",
    });
    return;
  }

  // Check for both "COMPLETED" and "OK" status
  if (req.body.status === "COMPLETED" || req.body.status === "OK") {
    try {
      // Check if we have payload data directly in the webhook
      let loraUrl;
      if (req.body.payload && req.body.payload.diffusers_lora_file && req.body.payload.diffusers_lora_file.url) {
        // Extract directly from webhook payload
        loraUrl = req.body.payload.diffusers_lora_file.url;
        console.log("Using lora URL from webhook payload:", loraUrl);
      } else {
        // Fetch result from fal.ai if not in payload
        console.log("Fetching result from fal.ai");
        const result = await fal.queue.result("fal-ai/flux-lora-fast-training", {
          requestId,
        });
        console.log("Fal.ai result:", result);
        const resultData = result.data as any;
        loraUrl = resultData.diffusers_lora_file.url;
      }

      console.log("Generating preview image with lora URL:", loraUrl);
      const { imageUrl } = await falAiModel.generateImageSync(loraUrl);

      console.log("Generated preview image:", imageUrl);

      await prismaClient.model.updateMany({
        where: {
          falAiRequestId: requestId,
        },
        data: {
          trainingStatus: "Generated",
          tensorPath: loraUrl,
          thumbnail: imageUrl,
        },
      });

      console.log("Updated model for user:", model.userId);
    } catch (error) {
      console.error("Error processing webhook:", error);
      await prismaClient.model.updateMany({
        where: {
          falAiRequestId: requestId,
        },
        data: {
          trainingStatus: "Failed",
        },
      });
    }
  } else {
    // For any other status, keep it as Pending
    console.log("Updating model status to: Pending");
    await prismaClient.model.updateMany({
      where: {
        falAiRequestId: requestId,
      },
      data: {
        trainingStatus: "Pending",
      },
    });
  }

  res.json({
    message: "Webhook processed successfully",
  });
});

app.post("/fal-ai/webhook/image", async (req, res) => {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/80d89e10-42ab-423c-9694-0caffe7315c6", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "W2",
      location: "apps/backend/index.ts:/fal-ai/webhook/image:entry",
      message: "Received image webhook",
      data: {
        hasBody: !!req.body,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  console.log("fal-ai/webhook/image");
  console.log(req.body);
  // update the status of the image in the DB
  const requestId = req.body.request_id;

  if (req.body.status === "ERROR") {
    res.status(411).json({});
    const imageUrl = req.body.payload?.images?.[0]?.url ?? "";
    await prismaClient.outputImages.updateMany({
      where: {
        falAiRequestId: requestId,
      },
      data: {
        status: "Failed",
        imageUrl,
      },
    });
    return;
  }

  await prismaClient.outputImages.updateMany({
    where: {
      falAiRequestId: requestId,
    },
    data: {
      status: "Generated",
      imageUrl: req.body.payload.images[0].url,
    },
  });

  res.json({
    message: "Webhook received",
  });
});

app.get("/model/status/:modelId", authMiddleware, async (req, res) => {
  try {
    const modelId = req.params.modelId;

    const model = await prismaClient.model.findUnique({
      where: {
        id: modelId,
        userId: req.userId,
      },
    });

    if (!model) {
      res.status(404).json({
        success: false,
        message: "Model not found",
      });
      return;
    }

    // Return basic model info with status
    res.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        status: model.trainingStatus,
        thumbnail: model.thumbnail,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
    });
    return;
  } catch (error) {
    console.error("Error checking model status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check model status",
    });
    return;
  }
});

app.use("/api/webhook", webhookRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
