import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // .docx templates are read from disk at request time; make sure they ship with the serverless bundle.
  outputFileTracingIncludes: {
    "/api/documents/**": ["./templates/**/*"],
    "/api/templates/**": ["./templates/**/*"],
  },
  serverExternalPackages: ["docxtemplater", "pizzip"],
};

export default nextConfig;
