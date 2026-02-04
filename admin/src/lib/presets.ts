export type PresetId = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight'

export interface PresetDefinition {
  id: PresetId
  name: string
  description: string
  preview: {
    accent: string
    highlight: string
    background: string
  }
}

export const PRESETS = [
  {
    id: 'default',
    name: 'Default',
    description: 'Arsenal blue',
    preview: {
      accent: '#3B82F6',
      highlight: '#60A5FA',
      background: '#1E3A5F',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep teal depths',
    preview: {
      accent: '#0D9488',
      highlight: '#2DD4BF',
      background: '#134E4A',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens',
    preview: {
      accent: '#16A34A',
      highlight: '#4ADE80',
      background: '#14532D',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm oranges',
    preview: {
      accent: '#EA580C',
      highlight: '#FB923C',
      background: '#7C2D12',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep purples',
    preview: {
      accent: '#7C3AED',
      highlight: '#A78BFA',
      background: '#3B0764',
    },
  },
] as const satisfies readonly PresetDefinition[]
