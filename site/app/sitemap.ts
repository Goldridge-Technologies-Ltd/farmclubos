import type { MetadataRoute } from "next";
import { siteNavigation } from "@/lib/navigation";

const siteUrl = "https://farmclub-os.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...siteNavigation.map((item) => item.href),
    "/privacy-policy",
    "/terms-of-service",
  ];

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
