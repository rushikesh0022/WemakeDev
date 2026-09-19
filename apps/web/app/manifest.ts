import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pico",
    short_name: "Pico",
    description: "Your neighbourhood store, in minutes",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f4",
    theme_color: "#f04f3d",
    icons: []
  };
}
