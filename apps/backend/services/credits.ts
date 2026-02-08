import { prismaClient } from "db";

/** Credit cost for training a model */
export const CREDITS_TRAINING = 10;

/** Credit cost per single image generation (generate image endpoint) */
export const CREDITS_PER_IMAGE = 100;

/**
 * Get current credit balance for a user (Clerk user id).
 */
export async function getCredits(userId: string): Promise<number> {
  const row = await prismaClient.userCredit.findUnique({
    where: { userId },
    select: { amount: true },
  });
  return row?.amount ?? 0;
}

/**
 * Ensure a UserCredit row exists for the user (e.g. after auth).
 */
export async function ensureUserCredit(userId: string): Promise<void> {
  await prismaClient.userCredit.upsert({
    where: { userId },
    update: {},
    create: { userId, amount: 0 },
  });
}

/**
 * Deduct credits if the user has enough. Returns true if deduction succeeded.
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ ok: boolean; remaining?: number }> {
  if (amount <= 0) return { ok: true };

  const updated = await prismaClient.userCredit.updateMany({
    where: {
      userId,
      amount: { gte: amount },
    },
    data: {
      amount: { decrement: amount },
    },
  });

  if (updated.count === 0) {
    return { ok: false };
  }

  const row = await prismaClient.userCredit.findUnique({
    where: { userId },
    select: { amount: true },
  });
  return { ok: true, remaining: row?.amount ?? 0 };
}

/**
 * Check if user has at least `amount` credits (without deducting).
 */
export async function hasEnoughCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const balance = await getCredits(userId);
  return balance >= amount;
}
