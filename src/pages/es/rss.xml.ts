import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import getSortedPosts from "@/utils/getSortedPosts";
import { getLocalePosts, getPostUrl } from "@/utils/i18n";
import { SITE } from "@/config";

export async function GET() {
  const posts = getLocalePosts(await getCollection("blog"), "es");
  return rss({
    title: `${SITE.title} — Blog`,
    description: "Escribo sobre software, trabajo y cosas que merece la pena conservar.",
    site: SITE.website,
    items: getSortedPosts(posts).map(post => ({
      link: getPostUrl(post),
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.modDatetime ?? post.data.pubDatetime),
    })),
  });
}
