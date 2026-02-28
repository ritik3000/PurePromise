import { prismaClient } from "db";
import { Router } from "express";
import { Webhook } from "svix";

export const router = Router();

/**
 * POST api/webhook/clerk
 * Clerk webhook endpoint
 */
router.post("/clerk", async (req, res) => {
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/1a00abdd-af60-4b80-940b-7fc14120bf30", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "webhook.routes.ts:clerk:entry",
      message: "Clerk webhook handler entered",
      data: { method: req.method, hasBody: !!req.body, bodyType: typeof req.body },
      timestamp: Date.now(),
      runId: "clerk-webhook",
      hypothesisId: "H1-request-reaches-handler",
    }),
  }).catch(() => {});
  // #endregion
  const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/1a00abdd-af60-4b80-940b-7fc14120bf30", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "webhook.routes.ts:clerk:after-secret",
      message: "SIGNING_SECRET check",
      data: { hasSigningSecret: !!SIGNING_SECRET },
      timestamp: Date.now(),
      runId: "clerk-webhook",
      hypothesisId: "H2-secret-missing",
    }),
  }).catch(() => {});
  // #endregion

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env"
    );
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headers = req.headers;
  // Use raw body string for Svix verification (signature is over exact bytes; express.json() would change them)
  const rawBody =
    typeof req.body === "string"
      ? req.body
      : Buffer.isBuffer(req.body)
        ? (req.body as Buffer).toString("utf8")
        : JSON.stringify(req.body);

  const svix_id = headers["svix-id"];
  const svix_timestamp = headers["svix-timestamp"];
  const svix_signature = headers["svix-signature"];

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/1a00abdd-af60-4b80-940b-7fc14120bf30", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "webhook.routes.ts:clerk:svix-headers",
      message: "Svix headers check",
      data: {
        hasSvixId: !!svix_id,
        hasSvixTimestamp: !!svix_timestamp,
        hasSvixSignature: !!svix_signature,
      },
      timestamp: Date.now(),
      runId: "clerk-webhook",
      hypothesisId: "H3-headers-missing",
    }),
  }).catch(() => {});
  // #endregion

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({
      success: false,
      message: "Error: Missing svix headers",
    });
    return;
  }

  let evt: any;

  try {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/1a00abdd-af60-4b80-940b-7fc14120bf30", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "webhook.routes.ts:clerk:before-verify",
        message: "Before Svix verify",
        data: {
          bodyType: typeof req.body,
          rawBodyLength: rawBody.length,
        },
        timestamp: Date.now(),
        runId: "clerk-webhook",
        hypothesisId: "H4-body-format",
      }),
    }).catch(() => {});
    // #endregion
    evt = wh.verify(rawBody, {
      "svix-id": svix_id as string,
      "svix-timestamp": svix_timestamp as string,
      "svix-signature": svix_signature as string,
    });
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/1a00abdd-af60-4b80-940b-7fc14120bf30", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "webhook.routes.ts:clerk:verify-success",
        message: "Svix verify succeeded",
        data: { eventType: evt?.type },
        timestamp: Date.now(),
        runId: "clerk-webhook",
        hypothesisId: "H5-verify-ok",
      }),
    }).catch(() => {});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/1a00abdd-af60-4b80-940b-7fc14120bf30", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "webhook.routes.ts:clerk:verify-failed",
        message: "Svix verify failed",
        data: { errorMessage: (err as Error).message },
        timestamp: Date.now(),
        runId: "clerk-webhook",
        hypothesisId: "H4-H5-verify-fail",
      }),
    }).catch(() => {});
    // #endregion
    console.log("Error: Could not verify webhook:", (err as Error).message);
    res.status(400).json({
      success: false,
      message: (err as Error).message,
    });
    return;
  }

  const { id } = evt.data;
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
      case "user.updated": {
        await prismaClient.user.upsert({
          where: { clerkId: id },
          update: {
            name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim(),
            email: evt.data.email_addresses[0].email_address,
            profilePicture: evt.data.profile_image_url,
          },
          create: {
            clerkId: id,
            name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim(),
            email: evt.data.email_addresses[0].email_address,
            profilePicture: evt.data.profile_image_url,
          },
        });
        // Ensure UserCredit record exists (id is Clerk user id). New users get 400 credits.
        await prismaClient.userCredit.upsert({
          where: { userId: id },
          update: {},
          create: { userId: id, amount: 400 },
        });
        break;
      }

      case "user.deleted": {
        await prismaClient.userCredit.deleteMany({ where: { userId: id } });
        await prismaClient.user.delete({
          where: { clerkId: id },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
        break;
    }
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
  }

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/1a00abdd-af60-4b80-940b-7fc14120bf30", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "webhook.routes.ts:clerk:success",
      message: "Clerk webhook completed successfully",
      data: { eventType: evt?.type },
      timestamp: Date.now(),
      runId: "clerk-webhook",
      hypothesisId: "H5-handler-success",
    }),
  }).catch(() => {});
  // #endregion
  res.status(200).json({ success: true, message: "Webhook received" });
  return;
});
