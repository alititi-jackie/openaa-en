export interface EcoService {
  id: string;
  name: string;
  url: string;
  description: string;
  categoryIds: string[];
}

/**
 * OpenAA 生态服务：按场景关联，详情页按 categoryIds 匹配展示 ≤3 个。
 * 不在每页强制展示全部。
 */
export const ECO_SERVICES: EcoService[] = [
  {
    id: 'jobs',
    name: 'OpenAA 招聘',
    url: 'https://openaa.com/jobs/?utm_source=en.openaa.com&utm_medium=eco',
    description: '在美华人找工作',
    categoryIds: ['work', 'factory'],
  },
  {
    id: 'housing',
    name: 'OpenAA 房屋',
    url: 'https://openaa.com/housing/?utm_source=en.openaa.com&utm_medium=eco',
    description: '租房买房信息',
    categoryIds: ['housing'],
  },
  {
    id: 'dmv',
    name: 'OpenAA DMV 题库',
    url: 'https://dmv.openaa.com/?utm_source=en.openaa.com&utm_medium=eco',
    description: '美国驾照笔试练习',
    categoryIds: ['driving'],
  },
  {
    id: 'tools',
    name: 'OpenAA 实用工具',
    url: 'https://tools.openaa.com/?utm_source=en.openaa.com&utm_medium=eco',
    description: '工资计算、单位换算等',
    categoryIds: ['work', 'banking', 'shopping'],
  },
  {
    id: 'numbermobi',
    name: 'NumberMobi 手机靓号',
    url: 'https://numbermobi.com/?utm_source=en.openaa.com&utm_medium=eco',
    description: '美国手机靓号选号',
    categoryIds: ['phone'],
  },
  {
    id: 'go',
    name: 'OpenAA 导航',
    url: 'https://go.openaa.com/?utm_source=en.openaa.com&utm_medium=eco',
    description: '华人常用网站导航',
    categoryIds: ['social', 'shopping', 'delivery'],
  },
];

/** 按分类取相关服务（最多 limit 个） */
export function ecoForCategories(categoryIds: string[], limit = 3): EcoService[] {
  const seen = new Set<string>();
  const out: EcoService[] = [];
  for (const s of ECO_SERVICES) {
    if (out.length >= limit) break;
    if (s.categoryIds.some((c) => categoryIds.includes(c)) && !seen.has(s.id)) {
      seen.add(s.id);
      out.push(s);
    }
  }
  return out;
}
