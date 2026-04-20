import { useEffect, useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'

interface PublicationEntry {
  slug: string
  data: {
    title: string
    authors: string
    journal?: string
    year: number
    doi?: string
    url?: string
    abstract?: string
    pdf?: string
  }
}

export default function Publications() {
  const [pubs, setPubs] = useState<PublicationEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/content/publications?sort=-year&limit=100')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setPubs(json.data ?? []))
      .catch(() => setPubs([]))
      .finally(() => setLoading(false))
  }, [])

  const byYear = pubs.reduce<Record<number, PublicationEntry[]>>((acc, p) => {
    const y = p.data.year
    ;(acc[y] ||= []).push(p)
    return acc
  }, {})
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <>
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-4">
              Publications
            </h1>
            <p className="text-lg text-gray-text">
              Peer-reviewed output from the FLUXIONIC network.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container max-w-4xl">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-text">Loading publications...</div>
            </div>
          ) : pubs.length === 0 ? (
            <p className="text-gray-text py-12 text-center">No publications yet.</p>
          ) : (
            <div className="space-y-12">
              {years.map((year) => (
                <div key={year}>
                  <h2 className="text-2xl font-heading font-bold text-dark mb-4 pb-2 border-b border-gray-200">
                    {year}
                  </h2>
                  <ul className="space-y-6">
                    {byYear[year].map((p) => (
                      <li key={p.slug} className="group">
                        <h3 className="font-heading font-semibold text-lg text-dark mb-1">
                          {p.data.title}
                        </h3>
                        <p className="text-sm text-gray-text mb-1">{p.data.authors}</p>
                        {p.data.journal && (
                          <p className="text-sm italic text-gray-text mb-2">{p.data.journal}</p>
                        )}
                        {p.data.abstract && (
                          <p className="text-sm text-gray-text line-clamp-3 mb-3">
                            {p.data.abstract}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {p.data.doi && (
                            <a
                              href={`https://doi.org/${p.data.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary inline-flex items-center gap-1 hover:underline"
                            >
                              DOI <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {p.data.url && (
                            <a
                              href={p.data.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary inline-flex items-center gap-1 hover:underline"
                            >
                              Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {p.data.pdf && (
                            <a
                              href={p.data.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary inline-flex items-center gap-1 hover:underline"
                            >
                              PDF <FileText className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
