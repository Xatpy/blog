import type { CollectionEntry } from "astro:content";

export type Locale = "es" | "en";

export const copy = {
  es: {
    blog: "Blog",
    intro: "Escribo sobre software, trabajo y cosas que merece la pena conservar.",
    tags: "Etiquetas",
    tagsDescription: "Explora los temas del blog.",
    tagDescription: (tag: string) => `Todos los artículos con la etiqueta «${tag}».`,
    previous: "Artículo anterior",
    next: "Artículo siguiente",
    readIn: "Read in English",
    back: "Volver",
    personalWriting: "Escritura personal",
  },
  en: {
    blog: "Blog",
    intro: "Personal writing on software, work, and things worth keeping.",
    tags: "Tags",
    tagsDescription: "Browse the topics used across the blog.",
    tagDescription: (tag: string) => `All the articles with the tag “${tag}”.`,
    previous: "Previous post",
    next: "Next post",
    readIn: "Leer en español",
    back: "Go back",
    personalWriting: "Personal writing",
  },
} as const;

export const isLocale = (locale: string): locale is Locale =>
  locale === "es" || locale === "en";

export const getPostUrl = (post: CollectionEntry<"blog">) => {
  const prefix = post.data.locale === "es" ? "/es" : "";
  const slug = post.id.split("/").at(-1);
  return `${prefix}/posts/${slug}`;
};

export const getLocalePosts = (
  posts: CollectionEntry<"blog">[],
  locale: Locale
) => posts.filter(post => post.data.locale === locale);
