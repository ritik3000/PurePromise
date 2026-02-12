import { fal } from "@fal-ai/client";
import express from "express";
import {
  TrainModel,
  GenerateImage,
  GenerateImagesFromPack,
  GeneratePackWithImages,
  GenerateImageFromReference,
} from "common/types";
import { prismaClient } from "db";
import { S3Client } from "bun";
import { FalAIModel } from "./models/FalAIModel";
import cors from "cors";
import { authMiddleware } from "./middleware";
import dotenv from "dotenv";

import { router as webhookRouter } from "./routes/webhook.routes";
import {
  getCredits,
  deductCredits,
  hasEnoughCredits,
  CREDITS_TRAINING,
  CREDITS_PER_IMAGE,
} from "./services/credits";

dotenv.config();

const PORT = process.env.PORT || 8080;

const falAiModel = new FalAIModel();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://pure-promise.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })  
);
app.use(express.json());

app.get("/pre-signed-url", async (req, res) => {
  const key = `models/${crypto.randomUUID()}.zip`;
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

/** Presigned URLs for couple images (non-zipped, up to 10). Key: couple-images/{userId}/{uploadId}/{uuid}.jpg */
/** Get current user credits (auth required). Row is created only at user creation (webhook). */
app.get("/credits", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const credits = await getCredits(userId);
    res.json({ credits, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error("Error fetching credits:", error);
    res.status(500).json({
      message: "Error fetching credits",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/** Record that the user has requested more credits (auth required). Optional phone stored. */
app.post("/credits/request", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() || null : null;
    if (phone && phone.length > 30) {
      res.status(400).json({ message: "Phone number must be at most 30 characters" });
      return;
    }
    await prismaClient.creditRequest.create({ data: { userId, phone } });
    res.status(201).json({ message: "Your request for more credits has been recorded. We'll be in touch." });
  } catch (error) {
    console.error("Error recording credit request:", error);
    res.status(500).json({
      message: "Error recording request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/presigned-url/images", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const uploadId = (req.body?.uploadId as string) || crypto.randomUUID();
  const count = Math.min(Math.max(Number(req.body?.count) || 1, 1), 10);
  const keys: { url: string; key: string }[] = [];
  for (let i = 0; i < count; i++) {
    const key = `couple-images/${userId}/${uploadId}/${crypto.randomUUID()}.jpg`;
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
    const userId = req.userId!;
    const enough = await hasEnoughCredits(userId, CREDITS_TRAINING);
    if (!enough) {
      res.status(402).json({
        message: "Insufficient credits",
        required: CREDITS_TRAINING,
      });
      return;
    }

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

    const deduct = await deductCredits(userId, CREDITS_TRAINING);
    if (!deduct.ok) {
      await prismaClient.model.delete({ where: { id: data.id } }).catch(() => {});
      res.status(402).json({ message: "Insufficient credits", required: CREDITS_TRAINING });
      return;
    }

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

/** Generate single image from reference images (3–10) + prompt. 25 credits. */
app.post("/ai/generate-from-images", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const enough = await hasEnoughCredits(userId, CREDITS_PER_IMAGE);
  if (!enough) {
    res.status(402).json({
      message: "Insufficient credits",
      required: CREDITS_PER_IMAGE,
    });
    return;
  }

  const parsed = GenerateImageFromReference.safeParse(req.body);
  if (!parsed.success) {
    res.status(411).json({
      message: "Input incorrect: need prompt and 3–10 image URLs",
      error: parsed.error,
    });
    return;
  }

  const { prompt, imageUrls } = parsed.data;
  const { request_id } = await falAiModel.generateImageFromReference(prompt, imageUrls);

  const data = await prismaClient.outputImages.create({
    data: {
      prompt,
      userId,
      imageUrl: "",
      falAiRequestId: request_id,
    },
  });

  const deduct = await deductCredits(userId, CREDITS_PER_IMAGE);
  if (!deduct.ok) {
    await prismaClient.outputImages.delete({ where: { id: data.id } }).catch(() => {});
    res.status(402).json({ message: "Insufficient credits", required: CREDITS_PER_IMAGE });
    return;
  }

  res.json({ imageId: data.id });
});

app.post("/ai/generate", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const enough = await hasEnoughCredits(userId, CREDITS_PER_IMAGE);
  if (!enough) {
    res.status(402).json({
      message: "Insufficient credits",
      required: CREDITS_PER_IMAGE,
    });
    return;
  }

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

  const deduct = await deductCredits(userId, CREDITS_PER_IMAGE);
  if (!deduct.ok) {
    await prismaClient.outputImages.delete({ where: { id: data.id } }).catch(() => {});
    res.status(402).json({ message: "Insufficient credits", required: CREDITS_PER_IMAGE });
    return;
  }

  res.json({
    imageId: data.id,
  });
});

app.post("/pack/generate", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const withImages = GeneratePackWithImages.safeParse(req.body);

  if (!withImages.success) {
    res.status(411).json({
      message: "Input incorrect",
    });
    return;
  }
    const { packId, imageUrls } = withImages.data;
    const pack = await prismaClient.packs.findUnique({
      where: { id: packId },
      select: { creditCost: true },
    });
    if (!pack) {
      res.status(404).json({ message: "Pack not found" });
      return;
    }
    const prompts = await prismaClient.packPrompts.findMany({
      where: { packId },
    });
    if (prompts.length === 0) {
      res.status(411).json({ message: "Pack has no prompts" });
      return;
    }
    const cost = pack.creditCost;
    if (cost > 0 && !(await hasEnoughCredits(userId, cost))) {
      res.status(402).json({
        message: "Insufficient credits",
        required: cost,
      });
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
    if (cost > 0) {
      const deduct = await deductCredits(userId, cost);
      if (!deduct.ok) {
        await prismaClient.outputImages.deleteMany({
          where: { id: { in: images.map((i) => i.id) } },
        }).catch(() => {});
        res.status(402).json({ message: "Insufficient credits", required: cost });
        return;
      }
    }
    res.json({ images: images.map((i) => i.id) });
    return;
  });


app.get("/pack/bulk", async (req, res) => {
  const packs = await prismaClient.packs.findMany({
    orderBy: [ { id: "asc" }, { name: "asc" }],
  });

  res.set("Cache-Control", "no-store");
  res.json({
    packs,
  });
});

app.get("/image/bulk", authMiddleware, async (req, res) => {
  const ids = req.query.ids;
  const limit = (req.query.limit as string) ?? "100";
  const offset = (req.query.offset as string) ?? "0";
  const idFilter =
    ids && Array.isArray(ids) && ids.length > 0 ? { id: { in: ids as string[] } } : {};

  const imagesData = await prismaClient.outputImages.findMany({
    where: {
      userId: req.userId!,
      status: {
        not: "Failed",
      },
      ...idFilter,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: parseInt(offset),
    take: parseInt(limit),
    select: {
      id: true,
      imageUrl: true,
      status: true,
      createdAt: true,
    },
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

const POST_GENERATION_SOURCE = "post_generation";

/** Submit feedback (contact form or post-generation). Public; optional auth links feedback to user. */
app.post("/feedback", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() || null : null;
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const source = typeof req.body?.source === "string" ? req.body.source.trim() || null : null;
    const ratingRaw = req.body?.rating;
    const rating =
      typeof ratingRaw === "number" && Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
        ? ratingRaw
        : null;

    if (!email || !message) {
      res.status(400).json({ message: "Email and message are required" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email address" });
      return;
    }
    if (phone && phone.length > 30) {
      res.status(400).json({ message: "Phone number must be at most 30 characters" });
      return;
    }
    if (message.length > 5000) {
      res.status(400).json({ message: "Message must be at most 5000 characters" });
      return;
    }
    if (source === POST_GENERATION_SOURCE && rating == null) {
      res.status(400).json({ message: "Rating is required for post-generation feedback" });
      return;
    }

    let userId: string | null = null;
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if (token && process.env.CLERK_JWT_PUBLIC_KEY) {
      try {
        const jwt = await import("jsonwebtoken");
        const formattedKey = process.env.CLERK_JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
        const decoded = jwt.verify(token, formattedKey, {
          algorithms: ["RS256"],
          issuer:
            process.env.CLERK_ISSUER ||
            "http://localhost:3000 || https://fe-staging.dxdev.space/",
          complete: true,
        }) as { payload?: { sub?: string } };
        if (decoded?.payload?.sub) userId = decoded.payload.sub;
      } catch {
        // ignore invalid token; submit as anonymous
      }
    }

    const feedback = await prismaClient.feedback.create({
      data: { email, phone, message, userId, rating, source },
    });
    res.status(201).json({ id: feedback.id, message: "Thank you for your feedback." });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      message: "Error submitting feedback",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/** Check if the authenticated user has already given post-generation feedback. */
app.get("/feedback/post-generation-given", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const existing = await prismaClient.feedback.findFirst({
      where: {
        userId,
        source: POST_GENERATION_SOURCE,
      },
    });
    res.json({ given: !!existing });
  } catch (error) {
    console.error("Error checking post-generation feedback:", error);
    res.status(500).json({
      message: "Failed to check feedback status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.use("/api/webhook", webhookRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
