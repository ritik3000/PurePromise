import { fal } from "@fal-ai/client";
import { BaseModel } from "./BaseModel";

export class FalAIModel {
  constructor() {}

  public async generateImage(prompt: string, tensorPath: string) {
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/fal-ai/webhook/image`;

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/80d89e10-42ab-423c-9694-0caffe7315c6", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "pre-fix",
        hypothesisId: "W1",
        location: "apps/backend/models/FalAIModel.ts:generateImage:before-submit",
        message: "Submitting Fal generateImage job",
        data: {
          webhookUrl,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const { request_id, response_url } = await fal.queue.submit(
      "fal-ai/flux-lora",
      {
        input: {
          prompt: prompt,
          loras: [{ path: tensorPath, scale: 1 }],
        },
        webhookUrl,
      }
    );

    return { request_id, response_url };
  }

  public async trainModel(zipUrl: string, triggerWord: string) {
    console.log("Training model with URL:", zipUrl);

    try {
      const response = await fetch(zipUrl, { method: "HEAD" });
      if (!response.ok) {
        console.error(
          `ZIP URL not accessible: ${zipUrl}, status: ${response.status}`
        );
        throw new Error(`ZIP URL not accessible: ${response.status}`);
      }
    } catch (error) {
      console.error("Error checking ZIP URL:", error);
      throw new Error(`ZIP URL validation failed: ${error as any}.message}`);
    }

    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/fal-ai/webhook/train`;

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/80d89e10-42ab-423c-9694-0caffe7315c6", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "pre-fix",
        hypothesisId: "W1",
        location: "apps/backend/models/FalAIModel.ts:trainModel:before-submit",
        message: "Submitting Fal training job",
        data: {
          webhookUrl,
          zipUrl,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const { request_id, response_url } = await fal.queue.submit(
      "fal-ai/flux-lora-fast-training",
      {
        input: {
          images_data_url: zipUrl,
          trigger_word: triggerWord,
        },
        webhookUrl,
      }
    );

    console.log("Model training submitted:", request_id);
    return { request_id, response_url };
  }

  public async generateImageSync(tensorPath: string) {
    const response = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt:
          "Generate a head shot for this user in front of a white background",
        loras: [{ path: tensorPath, scale: 1 }],
      },
    });
    return {
      imageUrl: response.data.images[0].url,
    };
  }
}
