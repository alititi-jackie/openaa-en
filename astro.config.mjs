import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://en.openaa.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        // 2026-10-28 修复实际改动过的页面（首页 + /phrases/ 枢纽与全部句子详情页）
        // 才写 lastmod；未改动的页面不写，避免伪造新鲜度信号。
        const path = new URL(item.url).pathname;
        if (path === '/' || path.startsWith('/phrases/')) {
          item.lastmod = '2026-10-28T00:00:00.000Z';
        }
        return item;
      },
    }),
  ],
});
