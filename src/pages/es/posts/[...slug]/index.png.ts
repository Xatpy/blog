import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOgImageForPost } from "@/utils/generateOgImages";
import { SITE } from "@/config";
export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) return [];
  const posts = await getCollection("blog").then(posts => posts.filter(({ data }) => !data.draft && !data.ogImage && data.locale === "es"));
  return posts.map(post => ({ params: { slug: post.id.split("/").at(-1) }, props: post }));
}
export const GET: APIRoute = async ({ props }) => {
  if (!SITE.dynamicOgImage) return new Response(null, { status: 404 });
  const buffer = await generateOgImageForPost(props as CollectionEntry<"blog">);
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "image/png" } });
};
