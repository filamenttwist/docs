import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Filament Twist Docs",
  description: "Modular Filament Platform with Addon Architecture and Multi-Tenancy",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/twist-class' },
      { text: 'Examples', link: '/examples/' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Creating Addons', link: '/guide/creating-addons' },
          { text: 'Multi-Tenancy', link: '/guide/multi-tenancy' },
          { text: 'Console Commands', link: '/guide/console-commands' },
          { text: 'Panel Configuration', link: '/guide/panel-configuration' },
          { text: 'Configuration Reference', link: '/guide/configuration' }
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Complete Examples', link: '/examples/' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'TwistClass', link: '/api/twist-class' },
          { text: 'Addon Interfaces', link: '/api/addon-interfaces' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/filamenttwist/twist' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Filament Twist'
    },

    editLink: {
      pattern: 'https://github.com/filamenttwist/twist/edit/main/docs/:path'
    }
  }
})
