import { copyFile, access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const indexUrl = new URL('sitemap-index.xml', dist);
const targetUrl = new URL('sitemap.xml', dist);

// Keep Astro's sitemap index content unchanged; publish the same index at /sitemap.xml.
await access(indexUrl, constants.R_OK);
await copyFile(indexUrl, targetUrl);

const xml = await readFile(targetUrl, 'utf8');
if (!xml.includes('<sitemapindex') || !xml.includes('<loc>')) {
  throw new Error('dist/sitemap.xml is not a valid sitemap index');
}
console.log('Created dist/sitemap.xml from dist/sitemap-index.xml');
