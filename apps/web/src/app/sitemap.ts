import type { MetadataRoute } from "next";
import { seoServices, siteUrl } from "@/components/seo-data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${siteUrl}/about/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    },
    {
      url: `${siteUrl}/terms/`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4
    },
    ...seoServices.map((service) => ({
      url: `${siteUrl}/services/${service.slug}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85
    }))
  ];
}
