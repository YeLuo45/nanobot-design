import { defineConfig } from "vitepress";

export default defineConfig({
  title: "nanobot Design",
  description: "nanobot AI Agent Framework - Architecture Design Documentation",
  lang: "en-US",
  base: "/nanobot-design/",
  ignoreDeadLinks: true,

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
  ],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Home", link: "/" },
      { text: "Architecture", link: "/architecture" },
      { text: "Agent Loop", link: "/agent-loop" },
      { text: "Providers", link: "/providers" },
      { text: "Channels", link: "/channels" },
      { text: "Tools", link: "/tools" },
      { text: "Memory", link: "/memory" },
      { text: "API", link: "/api" },
    ],

    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Home", link: "/" },
          { text: "Architecture Overview", link: "/architecture" },
          { text: "Agent Loop", link: "/agent-loop" },
          { text: "LLM Providers", link: "/providers" },
          { text: "Chat Channels", link: "/channels" },
          { text: "Tools System", link: "/tools" },
          { text: "Memory & Sessions", link: "/memory" },
          { text: "API Reference", link: "/api" },
          { text: "Getting Started", link: "/getting-started" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/YeLuo45/nanobot-design" },
      { icon: "external", link: "https://github.com/HKUDS/nanobot" },
    ],

    footer: {
      message: "Based on nanobot - Ultra-lightweight AI Agent Framework",
      copyright: "Copyright © 2024-present nanobot Contributors",
    },
  },
});
