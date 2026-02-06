/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
                protocol: "https",
                hostname: "r2-us-west.photoai.com",
            },
            {
                protocol: "https",
                hostname: "r2-us-east.photoai.com",
            },
            {
                protocol: "https",
                hostname: "i0.wp.com",
            },
            {
                protocol: "https",
                hostname: "encrypted-tbn1.gstatic.com",
            },
            {
                protocol: "https",
                hostname: "purepromise.s3.ap-south-1.amazonaws.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "v3.fal.media",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "v3b.fal.media",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "cloudflare-ipfs.com",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "api.dicebear.com",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;