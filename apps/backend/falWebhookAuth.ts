import type { Request, Response, NextFunction } from "express";

const FAL_META_URL = "https://api.fal.ai/v1/meta";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour; fal recommends fetching periodically

let cachedRanges: string[] | null = null;
let cacheTime = 0;

/**
 * Fetch webhook IP ranges from fal.ai meta endpoint.
 * @see https://docs.fal.ai/model-apis/model-endpoints/webhooks#webhook-ip-ranges
 */
async function getFalWebhookIpRanges(): Promise<string[]> {
  const now = Date.now();
  if (cachedRanges !== null && now - cacheTime < CACHE_TTL_MS) {
    return cachedRanges;
  }
  const res = await fetch(FAL_META_URL);
  if (!res.ok) {
    throw new Error(`fal meta fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as { webhook_ip_ranges?: string[] };
  const ranges = data.webhook_ip_ranges ?? [];
  cachedRanges = ranges;
  cacheTime = now;
  console.log("fal webhook IP ranges", ranges);
  return ranges;
}

/**
 * Check if an IPv4 address is inside a CIDR range (e.g. "34.123.59.101/32").
 */
function ipv4InCidr(ip: string, cidr: string): boolean {
  const [networkStr, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  const ipParts = ip.split(".").map(Number);
  if (ipParts.length !== 4 || ipParts.some((n) => n < 0 || n > 255)) return false;
  const ipNum =
    (ipParts[0]! << 24) | (ipParts[1]! << 16) | (ipParts[2]! << 8) | ipParts[3]!;

  const netParts = networkStr!.split(".").map(Number);
  if (netParts.length !== 4 || netParts.some((n) => n < 0 || n > 255)) return false;
  const netNum =
    (netParts[0]! << 24) | (netParts[1]! << 16) | (netParts[2]! << 8) | netParts[3]!;

  const mask = prefix === 0 ? 0 : (0xffff_ffff << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (netNum & mask);
}

/**
 * Get client IP from request (supports proxy via X-Forwarded-For when trust proxy is set).
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  console.log("forwarded", forwarded);
  if (forwarded) {
    const first = typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded[0];
    const ip = first?.trim();
    if (ip) return ip;
  }
  
  return req.ip ?? req.socket.remoteAddress ?? "";
}

/**
 * Express middleware: allow only requests whose source IP is in fal.ai webhook IP ranges.
 * Fetches ranges from https://api.fal.ai/v1/meta and caches them.
 * @see https://docs.fal.ai/model-apis/model-endpoints/webhooks#webhook-ip-ranges
 */
export async function falWebhookIpAllowlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const clientIp = getClientIp(req);
  if (!clientIp) {
    res.status(403).json({ success: false, message: "Unknown client IP" });
    return;
  }

  // Strip IPv6 prefix if present (e.g. "::ffff:192.168.1.1" -> "192.168.1.1")
  const ip = clientIp.replace(/^::ffff:/i, "");

  let ranges: string[];
  try {
    ranges = await getFalWebhookIpRanges();
  } catch (e) {
    console.error("fal webhook IP allowlist: failed to fetch meta", e);
    res.status(503).json({
      success: false,
      message: "Webhook IP verification temporarily unavailable",
    });
    return;
  }

  const allowed = ranges.some((cidr) => {
    if (cidr.includes(":")) {
      // IPv6 range - skip for now (fal examples are IPv4 only)
      return false;
    }
    return ipv4InCidr(ip, cidr);
  });

  if (!allowed) {
    res.status(403).json({
      success: false,
      message: "Request not from fal.ai webhook IP range",
    });
    return;
  }

  next();
}
