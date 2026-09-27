import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 固定 YYYY.MM.DD 格式。
 * 不走 toLocaleDateString —— 服务端 locale 与浏览器不一致时会渲染出不同的字符串，
 * 导致 Vue hydration text mismatch。
 */
export function formatDate(v: string | Date | number | null | undefined) {
  if (v === null || v === undefined)
    return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime()))
    return String(v)
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`
}
