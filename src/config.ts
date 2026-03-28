export const SITE = {
  website: "https://blog.jaimechapinal.com",
  author: "Jaime Chapinal",
  profile: "https://www.jaimechapinal.com",
  desc: "Personal writing on software, work, and things worth keeping.",
  title: "Jaime Chapinal",
  ogImage: "",
  lightAndDarkMode: true,
  postPerPage: 12,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Europe/Madrid", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
