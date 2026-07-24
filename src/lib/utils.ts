import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const levelLabelMap: Record<string, string> = {
  Core: '核心',
  Advanced: '进阶',
  Mastery: '精通',
  Elite: '认证',
};

/** 将英文层级标识转为中文显示标签 */
export function levelLabel(level?: string): string {
  return levelLabelMap[level || 'Core'] || level || '核心';
}
