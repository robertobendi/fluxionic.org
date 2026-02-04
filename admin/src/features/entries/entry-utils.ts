import type { Entry } from '@/types/entry'

/**
 * Get display title from entry data
 */
export function getEntryTitle(entry: Entry): string {
  const titleFields = ['title', 'name', 'heading', 'label']
  for (const field of titleFields) {
    if (entry.data[field]) {
      return String(entry.data[field])
    }
  }
  const firstValue = Object.values(entry.data)[0]
  return firstValue ? String(firstValue) : entry.slug
}
