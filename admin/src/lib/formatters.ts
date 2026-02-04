/**
 * Shared formatting utilities
 */

type DateFormat = 'short' | 'long' | 'datetime'

const DATE_OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  short: { year: 'numeric', month: 'short', day: 'numeric' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  datetime: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
}

/**
 * Format a date string with configurable format
 * @param dateString - ISO date string
 * @param format - 'short' (Jan 1, 2025), 'long' (January 1, 2025), or 'datetime' (includes time)
 */
export function formatDate(dateString: string, format: DateFormat = 'short'): string {
  return new Date(dateString).toLocaleDateString('en-US', DATE_OPTIONS[format])
}

/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @param decimals - Decimal places (default: 2)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Format bytes specifically for memory display (MB only)
 */
export function formatMemory(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(0)} MB`
}

/**
 * Format uptime in hours and minutes
 */
export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}
