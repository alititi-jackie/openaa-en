export const SITE = {
  name: 'OpenAA 美国生活英语',
  enName: 'OpenAA Everyday English',
  domain: 'https://en.openaa.com',
  tagline: '美国生活英语，查得到、听得懂、说得出。',
} as const;

export const NAV = [
  { href: '/', label: '首页' },
  { href: '/words/', label: '英语词典' },
  { href: '/scenes/', label: '情景英语' },
  { href: '/phrases/', label: '常用句子' },
  { href: '/practice/', label: '发音练习' },
] as const;

export const ECO_LINKS = [
  { href: 'https://openaa.com/', label: 'OpenAA 主站' },
  { href: 'https://go.openaa.com/', label: 'OpenAA 导航' },
  { href: 'https://dmv.openaa.com/', label: 'DMV 题库' },
  { href: 'https://tools.openaa.com/', label: '实用工具' },
  { href: 'https://numbermobi.com/', label: 'NumberMobi 靓号' },
] as const;
