import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nesto",
    short_name: "Nesto",
    description: "Everything you need, in minutes",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f2",
    theme_color: "#173f2a",
    icons: [
      { src: "/nesto/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/nesto/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
