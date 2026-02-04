// Arsenal 8 accent colors with Tailwind class variants
export const ARSENAL_ACCENTS = {
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', solid: 'bg-blue-500' },
  teal: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30', solid: 'bg-teal-500' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', solid: 'bg-purple-500' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', solid: 'bg-orange-500' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', solid: 'bg-pink-500' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', solid: 'bg-yellow-500' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', solid: 'bg-green-500' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', solid: 'bg-red-500' },
} as const

const ACCENT_KEYS = Object.keys(ARSENAL_ACCENTS) as (keyof typeof ARSENAL_ACCENTS)[]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getAccentForString(str: string) {
  const hash = hashString(str)
  const key = ACCENT_KEYS[hash % ACCENT_KEYS.length]
  return ARSENAL_ACCENTS[key]
}
