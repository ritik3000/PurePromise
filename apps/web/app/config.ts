export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

// Public base URL for accessing training ZIPs stored in S3.
// Make sure the bucket/object ACL or bucket policy allows public read
// (or update this to a CloudFront distribution URL if you front the bucket).
export const S3_PUBLIC_URL =
  process.env.NEXT_PUBLIC_S3_PUBLIC_URL ||
  "https://purepromise.s3.ap-south-1.amazonaws.com";
