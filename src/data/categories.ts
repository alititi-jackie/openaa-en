export interface Category {
  id: string;
  nameCn: string;
  nameEn: string;
  description: string;
  icon: string;
}

/** 统一分类体系：唯一定义处，各模块引用 id */
export const CATEGORIES: Category[] = [
  { id: 'work', nameCn: '工作与工资', nameEn: 'Work & Pay', icon: '💼', description: '请假、工资条、打卡、加班等工作场景的实用英语表达。' },
  { id: 'factory', nameCn: '工厂与维修', nameEn: 'Factory & Repair', icon: '🔧', description: '工厂上班、机器故障、维修沟通的常用英语。' },
  { id: 'housing', nameCn: '租房与住房', nameEn: 'Housing & Rent', icon: '🏠', description: '找房、签约、交租、报修等租房英语。' },
  { id: 'shopping', nameCn: '超市与购物', nameEn: 'Shopping', icon: '🛒', description: '超市购物、退货、问价、结账的实用英语。' },
  { id: 'medical', nameCn: '医院与看病', nameEn: 'Medical Care', icon: '🏥', description: '预约医生、看病、拿药、保险等医疗英语。' },
  { id: 'driving', nameCn: '汽车与驾驶', nameEn: 'Driving & Cars', icon: '🚗', description: '买车、修车、加油、处理罚单的英语表达。' },
  { id: 'banking', nameCn: '银行与付款', nameEn: 'Banking & Payment', icon: '🏦', description: '开户、转账、账单、付款问题的英语。' },
  { id: 'phone', nameCn: '电话与网络', nameEn: 'Phone & Internet', icon: '📱', description: '办电话卡、宽带、话费问题的沟通英语。' },
  { id: 'education', nameCn: '学校与孩子', nameEn: 'School & Kids', icon: '🎒', description: '孩子上学、家长会、请假等学校英语。' },
  { id: 'restaurant', nameCn: '餐厅与外卖', nameEn: 'Restaurant & Takeout', icon: '🍜', description: '点餐、外卖、投诉、付小费的英语。' },
  { id: 'delivery', nameCn: '快递与邮局', nameEn: 'Delivery & Post', icon: '📦', description: '寄快递、查包裹、邮局办事的英语。' },
  { id: 'social', nameCn: '日常社交', nameEn: 'Daily Social', icon: '👋', description: '打招呼、闲聊、邻里往来的日常英语。' },
];

export const categoryById = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);
