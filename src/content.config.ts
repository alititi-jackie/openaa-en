import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from './src/data/categories';

const contentDir = join(dirname(fileURLToPath(import.meta.url)), 'content');

/**
 * JSON data loader：行为对标 Astro 5 的 `type: 'data'` collection，
 * entry.id 为文件名去后缀（如 pay-stub），与现有全部路由/模板兼容。
 */
function jsonLoader(subdir: string): Loader {
  return {
    name: `json-loader-${subdir}`,
    load: async ({ store, parseData, generateDigest }) => {
      store.clear();
      const dir = join(contentDir, subdir);
      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        const id = file.slice(0, -'.json'.length);
        const raw = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
        const data = await parseData({ id, data: raw });
        store.set({ id, data, digest: generateDigest(data) });
      }
    },
  };
}

const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];

const exampleSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
});

const words = defineCollection({
  loader: jsonLoader('words'),
  schema: z.object({
    id: z.string().min(1),
    english: z.string().min(1),
    chinese: z.string().min(1),
    partOfSpeech: z.string().optional(),
    explanation: z.string().min(1),
    examples: z.array(exampleSchema).min(1),
    categoryIds: z.array(z.enum(categoryIds)).min(1),
    relatedWordIds: z.array(z.string()).default([]),
    relatedSceneIds: z.array(z.string()).default([]),
    aliases: z.array(z.string()).default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const phrases = defineCollection({
  loader: jsonLoader('phrases'),
  schema: z.object({
    id: z.string().min(1),
    english: z.string().min(1),
    chinese: z.string().min(1),
    explanation: z.string().optional(),
    categoryIds: z.array(z.enum(categoryIds)).min(1),
    sceneIds: z.array(z.string()).default([]),
    alternatives: z.array(exampleSchema).default([]),
    aliases: z.array(z.string()).default([]),
  }),
});

const dialogueTurnSchema = z.object({
  speaker: z.string().min(1),
  speakerZh: z.string().min(1),
  en: z.string().min(1),
  zh: z.string().min(1),
});

const scenes = defineCollection({
  loader: jsonLoader('scenes'),
  schema: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    categoryIds: z.array(z.enum(categoryIds)).min(1),
    featuredPhrase: exampleSchema,
    phrases: z.array(exampleSchema).min(1),
    dialogue: z.array(dialogueTurnSchema).min(2),
    vocabularyIds: z.array(z.string()).default([]),
    relatedSceneIds: z.array(z.string()).default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

export const collections = { words, phrases, scenes };
