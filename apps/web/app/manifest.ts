import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zaply",
    short_name: "Zaply",
    description: "Everything you need, right now",
    start_url: "/",
    display: "standalone",
    background_color: "#f8faf5",
    theme_color: "#237a3b",
    icons: []
  };
}
