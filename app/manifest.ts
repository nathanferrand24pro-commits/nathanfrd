import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fitness — Protocole Huberman",
    short_name: "Fitness",
    description:
      "Suivi du protocole Foundational Fitness d'Andrew Huberman : musculation, cardio, nutrition et sommeil",
    start_url: "/fitness",
    scope: "/",
    display: "standalone",
    background_color: "#eef1ee",
    theme_color: "#eef1ee",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
