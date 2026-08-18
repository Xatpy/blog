import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@/config";
import getSortedPosts from "@/utils/getSortedPosts";
import { getLocalePosts, getPostUrl } from "@/utils/i18n";

const formatPosts = (
  posts: Awaited<ReturnType<typeof getCollection>>,
  site: URL
) =>
  getSortedPosts(posts)
    .map(
      post =>
        `- [${post.data.title}](${new URL(getPostUrl(post), site).href}): ${post.data.description}`
    )
    .join("\n");

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(SITE.website);
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const englishPosts = getLocalePosts(posts, "en");
  const spanishPosts = getLocalePosts(posts, "es");

  const content = `# Jaime Chapinal

> Personal writing on software, work, AI, and things worth keeping. The blog is available in English and Spanish.

## English

- [Blog](${new URL("/", baseUrl).href})
- [RSS](${new URL("/rss.xml", baseUrl).href})

${formatPosts(englishPosts, baseUrl)}

## Español

- [Blog](${new URL("/es/", baseUrl).href})
- [RSS](${new URL("/es/rss.xml", baseUrl).href})

${formatPosts(spanishPosts, baseUrl)}
`;

  return new Response(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
