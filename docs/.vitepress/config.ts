import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "DocsJS",
  description: "The Lossless Word Pipeline for Web",
  lang: "en-US",

  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap",
        rel: "stylesheet",
      },
    ],
    ["meta", { name: "theme-color", content: "#0e8b78" }],
  ],

  locales: {
    root: {
      label: "English",
      lang: "en",
      title: "DocsJS",
      description: "The Lossless Word Pipeline for Web",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/", activeMatch: "/guide/" },
          { text: "API", link: "/api/", activeMatch: "/api/" },
          { text: "Examples", link: "/examples/", activeMatch: "/examples/" },
          {
            text: "v1.0.0",
            items: [
              { text: "Changelog", link: "https://github.com/fanly/docsjs/releases" },
              {
                text: "Contributing",
                link: "https://github.com/fanly/docsjs/blob/main/CONTRIBUTING.md",
              },
            ],
          },
        ],
        editLink: {
          pattern: "https://github.com/fanly/docsjs/edit/main/docs/:path",
          text: "Edit this page on GitHub",
        },
        footer: {
          message: "Released under the MIT License.",
          copyright: "Copyright © 2024-present DocsJS Team",
        },
        docFooter: {
          prev: "Previous",
          next: "Next",
        },
        outline: {
          label: "On this page",
        },
        lastUpdated: {
          text: "Last updated",
          formatOptions: {
            dateStyle: "short",
            timeStyle: "short",
          },
        },
        sidebar: {
          "/guide/": [
            {
              text: "Getting Started",
              items: [
                { text: "Introduction", link: "/guide/" },
                { text: "Installation", link: "/guide/installation" },
                { text: "Quick Start", link: "/guide/quick-start" },
              ],
            },
            {
              text: "Core Concepts",
              items: [
                { text: "Architecture", link: "/guide/architecture" },
                { text: "Plugin System", link: "/guide/plugins" },
                { text: "Profile System", link: "/guide/profiles" },
              ],
            },
            {
              text: "Advanced",
              items: [
                { text: "Security Model", link: "/guide/security" },
                { text: "Performance", link: "/guide/performance" },
              ],
            },
          ],
          "/api/": [
            {
              text: "API Reference",
              items: [
                { text: "Overview", link: "/api/" },
                { text: "CoreEngine", link: "/api/core-engine" },
                { text: "Components", link: "/api/components" },
                { text: "Events", link: "/api/events" },
                { text: "Types", link: "/api/types" },
              ],
            },
          ],
        },
      },
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      title: "DocsJS",
      description: "无损 Word 文档 Web 转换管道",
      themeConfig: {
        nav: [
          { text: "指南", link: "/zh/guide/", activeMatch: "/zh/guide/" },
          { text: "API", link: "/zh/api/", activeMatch: "/zh/api/" },
          { text: "示例", link: "/zh/examples/", activeMatch: "/zh/examples/" },
          {
            text: "v1.0.0",
            items: [
              { text: "更新日志", link: "https://github.com/fanly/docsjs/releases" },
              {
                text: "贡献指南",
                link: "https://github.com/fanly/docsjs/blob/main/CONTRIBUTING.md",
              },
            ],
          },
        ],
        editLink: {
          pattern: "https://github.com/fanly/docsjs/edit/main/docs/:path",
          text: "在 GitHub 上编辑此页",
        },
        footer: {
          message: "基于 MIT 许可发布。",
          copyright: "版权所有 © 2024-至今 DocsJS 团队",
        },
        docFooter: {
          prev: "上一页",
          next: "下一页",
        },
        outline: {
          label: "页面导航",
        },
        lastUpdated: {
          text: "最后更新于",
          formatOptions: {
            dateStyle: "short",
            timeStyle: "short",
          },
        },
        sidebar: {
          "/zh/guide/": [
            {
              text: "开始使用",
              items: [
                { text: "介绍", link: "/zh/guide/" },
                { text: "安装", link: "/zh/guide/installation" },
                { text: "快速开始", link: "/zh/guide/quick-start" },
              ],
            },
            {
              text: "核心概念",
              items: [
                { text: "架构设计", link: "/zh/guide/architecture" },
                { text: "插件系统", link: "/zh/guide/plugins" },
                { text: "配置系统", link: "/zh/guide/profiles" },
              ],
            },
            {
              text: "进阶",
              items: [
                { text: "安全模型", link: "/zh/guide/security" },
                { text: "性能优化", link: "/zh/guide/performance" },
              ],
            },
          ],
          "/zh/api/": [
            {
              text: "API 参考",
              items: [
                { text: "概览", link: "/zh/api/" },
                { text: "CoreEngine", link: "/zh/api/core-engine" },
                { text: "组件", link: "/zh/api/components" },
                { text: "事件", link: "/zh/api/events" },
                { text: "类型", link: "/zh/api/types" },
              ],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "DocsJS",

    socialLinks: [
      { icon: "github", link: "https://github.com/fanly/docsjs" },
      { icon: "npm", link: "https://www.npmjs.com/package/@coding01/docsjs" },
    ],

    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "Search...",
            buttonAriaLabel: "Search",
          },
          modal: {
            noResultsText: "No results for",
            resetButtonTitle: "Clear search query",
            footer: {
              selectText: "to select",
              navigateText: "to navigate",
              closeText: "to close",
            },
          },
        },
      },
    },
  },

  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },

  vite: {
    resolve: {
      alias: {
        "@": "/docs",
      },
    },
  },
});
