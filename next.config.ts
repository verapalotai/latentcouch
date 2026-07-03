import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transformers.js pulls in onnxruntime-node (native binaries) — keep it external to
  // the server bundle so Next doesn't try to trace/bundle the .node files.
  serverExternalPackages: ["@huggingface/transformers"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
