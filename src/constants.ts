import { Course, Resource } from './types';

export const COURSES: Course[] = [
  {
    id: '1',
    title: '威科夫理论核心：机构资金行为分析',
    instructor: '课程导师组',
    level: 'Beginner',
    duration: '12 课时 / 24小时',
    students: 1200,
    progress: 100,
    image: 'https://images.unsplash.com/photo-1611974717484-2450978ce228?q=80&w=800&auto=format&fit=crop',
    category: '基础入门'
  },
  {
    id: '2',
    title: '进阶量价分析：VSA 供需关系深度解析',
    instructor: '课程导师组',
    level: 'Intermediate',
    duration: '24 课时 / 60小时',
    students: 850,
    progress: 45,
    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
    category: '进阶策略'
  },
  {
    id: '3',
    title: '实战演练：吸筹与派发区间的精准识别',
    instructor: '课程导师组',
    level: 'Advanced',
    duration: '15 课时 / 30小时',
    students: 620,
    progress: 0,
    image: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=800&auto=format&fit=crop',
    category: '实战演练'
  },
  {
    id: 'vip1',
    title: '精英计划：机构级盘面实时拆解',
    instructor: '高级导师组',
    level: 'Elite',
    duration: '30 课时',
    students: 320,
    progress: 75,
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=800&auto=format&fit=crop',
    category: 'VIP专属'
  },
  {
    id: 'vip2',
    title: '心理博弈：交易中的自我控制与纪律',
    instructor: '高级导师组',
    level: 'Elite',
    duration: '20 课时',
    students: 150,
    progress: 20,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    category: 'VIP专属'
  }
];

export const RESOURCES: Resource[] = [
  { id: 'r1', name: '威科夫理论实战手册 (2024版).pdf', size: '4.5 MB', type: 'pdf', date: '2024-03-24' },
  { id: 'r2', name: '机构吸筹区间识别模板.xlsx', size: '12.2 KB', type: 'excel', date: '2024-03-22' },
  { id: 'r3', name: 'VSA 量价分析指标集.zip', size: '1.5 MB', type: 'zip', date: '2024-03-20' },
  { id: 'r4', name: '历史经典吸筹案例库 (高清).zip', size: '45 MB', type: 'zip', date: '2024-03-15' },
  { id: 'r5', name: '交易心理建设与复盘日志.pdf', size: '3.2 MB', type: 'pdf', date: '2024-03-10' },
  { id: 'r6', name: '机构资金流向监测工具.exe', size: '256 MB', type: 'code', date: '2024-03-05' }
];

export const ASSIGNMENTS = [
  {
    id: 'a1',
    title: '识别并标注当前盘面中的吸筹区间',
    course: '威科夫理论核心',
    status: 'graded',
    score: 98,
    dueDate: '2024-03-26',
    submittedAt: '2024-03-23',
    feedback: '对弹簧效应 (Spring) 的识别非常准确，继续保持。'
  },
  {
    id: 'a2',
    title: '分析特定品种的 VSA 量价特征',
    course: '进阶量价分析',
    status: 'pending',
    dueDate: '2024-03-31',
    submittedAt: '2024-03-24'
  },
  {
    id: 'a3',
    title: '制定一份基于威科夫逻辑的交易计划',
    course: '实战演练',
    status: 'not_submitted',
    dueDate: '2024-04-10'
  }
];

export const CERTIFICATIONS = [
  {
    id: 'c1',
    name: '威科夫理论初级认证 (Level 1)',
    status: 'completed',
    date: '2024-02-15',
    score: 98,
    credentialId: 'WYK-L1-2024-001'
  },
  {
    id: 'c2',
    name: '进阶量价分析师认证 (Level 2)',
    status: 'in_progress',
    progress: 65
  },
  {
    id: 'c3',
    name: '机构级交易员认证 (Elite)',
    status: 'locked',
    requirement: '完成精英计划并获得 Elite 计划准入'
  }
];
