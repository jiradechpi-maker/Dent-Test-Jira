import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DentOps · คณะทันตแพทยศาสตร์ สจล.",
    short_name: "DentOps",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4F0080",
    icons: [
      { src: "/brand/icons/check/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icons/check/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
