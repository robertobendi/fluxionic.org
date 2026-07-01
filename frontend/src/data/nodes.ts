export interface PI {
  name: string
  photo?: string
}

export interface Institution {
  name: string
  abbrev: string
  location: string
  country: string
  pis: PI[]
  associates?: string[]
}

// Fellow entry as returned by /api/content/fellows
export interface FellowEntry {
  slug: string
  data: {
    name: string
    photo?: string
    topic: string
    bio?: string
    institution?: string
    node?: string
    website?: string
    supervisor?: unknown
  }
}

export const institutions: Institution[] = [
  {
    name: 'University of Barcelona',
    abbrev: 'UB',
    location: 'Barcelona',
    country: 'Spain',
    pis: [
      { name: 'Ignacio Pagonabarraga', photo: '/pis/pagonabarraga.jpg' },
      { name: 'Jure Dobnikar', photo: '/pis/dobnikar.jpg' },
    ],
  },
  {
    name: 'CNRS Paris',
    abbrev: 'CNRS',
    location: 'Paris',
    country: 'France',
    pis: [
      { name: 'Marie-Laure Bocquet', photo: '/pis/ml-bocquet.jpg' },
      { name: 'Lyderic Bocquet', photo: '/pis/l-bocquet.jpg' },
      { name: 'Benjamin Rotenberg', photo: '/pis/rotenberg.jpg' },
      { name: 'Emmanuel Trizac', photo: '/pis/trizac.jpg' },
    ],
    associates: ['Ecole Normale Superieure-PSL', 'Universite Sorbonne', 'Universite Paris-Saclay'],
  },
  {
    name: 'Ruhr Universitat Bochum',
    abbrev: 'RUB',
    location: 'Bochum',
    country: 'Germany',
    pis: [{ name: 'Marialore Sulpizi', photo: '/pis/sulpizi.jpg' }],
  },
  {
    name: 'Freie Universitat Berlin',
    abbrev: 'FUB',
    location: 'Berlin',
    country: 'Germany',
    pis: [{ name: 'Roland Netz', photo: '/pis/netz.jpg' }],
  },
  {
    name: 'Max Planck Gesellschaft',
    abbrev: 'MPG',
    location: 'Mainz',
    country: 'Germany',
    pis: [{ name: 'Mischa Bonn', photo: '/pis/bonn.jpg' }],
  },
  {
    name: 'Sweetch Energy',
    abbrev: 'SWEETCH',
    location: 'Paris',
    country: 'France',
    pis: [{ name: 'Pascal Le Melinaire', photo: '/pis/lemelinaire.jpg' }],
  },
  {
    name: 'Norges Teknisk-Naturvitenskapelige Universitet',
    abbrev: 'NTNU',
    location: 'Trondheim',
    country: 'Norway',
    pis: [{ name: 'Erika Eiser', photo: '/pis/eiser.jpg' }],
  },
  {
    name: 'TU Delft',
    abbrev: 'TUD',
    location: 'Delft',
    country: 'Netherlands',
    pis: [
      { name: 'Claire Chassagne', photo: '/pis/chassagne.jpg' },
      { name: 'Remco Hartkamp', photo: '/pis/hartkamp.jpg' },
    ],
  },
  {
    name: 'University of Cambridge',
    abbrev: 'UCAM',
    location: 'Cambridge',
    country: 'United Kingdom',
    pis: [
      { name: 'Angelos Michaelides', photo: '/pis/michaelides.jpg' },
      { name: 'Daan Frenkel', photo: '/pis/frenkel.jpg' },
    ],
  },
  {
    name: 'University of Manchester',
    abbrev: 'UNIMAN',
    location: 'Manchester',
    country: 'United Kingdom',
    pis: [{ name: 'Radha Boya', photo: '/pis/boya.jpg' }],
  },
  {
    name: 'University of Oxford',
    abbrev: 'UOXF',
    location: 'Oxford',
    country: 'United Kingdom',
    pis: [{ name: 'Susan Perkin', photo: '/pis/perkin.jpg' }],
  },
  {
    name: 'Ecole Polytechnique Federale de Lausanne',
    abbrev: 'EPFL',
    location: 'Lausanne',
    country: 'Switzerland',
    pis: [
      { name: 'Michele Ceriotti', photo: '/pis/ceriotti.jpg' },
      { name: 'Sara Bonella', photo: '/pis/bonella.jpg' },
    ],
  },
]

export function institutionByAbbrev(abbrev?: string): Institution | undefined {
  return institutions.find((i) => i.abbrev.toLowerCase() === (abbrev || '').toLowerCase())
}

/** Fetch all fellows and group them by their node (institution abbrev). */
export async function fetchFellowsByNode(): Promise<Record<string, FellowEntry[]>> {
  try {
    const res = await fetch('/api/content/fellows?limit=100&sort=name')
    const json = res.ok ? await res.json() : { data: [] }
    const grouped: Record<string, FellowEntry[]> = {}
    for (const f of (json.data ?? []) as FellowEntry[]) {
      const key = (f.data.node || '').toUpperCase()
      ;(grouped[key] ||= []).push(f)
    }
    return grouped
  } catch {
    return {}
  }
}

/** Initial letter fallback avatar text. */
export function initials(name: string): string {
  return name.split(' ').pop()?.charAt(0) ?? '?'
}
