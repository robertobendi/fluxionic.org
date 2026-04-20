import { useEffect, useState } from 'react'
import { MapPin, GraduationCap, ExternalLink } from 'lucide-react'

interface PIEntry {
  slug: string
  data: {
    name: string
    affiliation?: string
    photo?: string
    bio?: string
    website?: string
  }
}

interface FellowEntry {
  slug: string
  data: {
    name: string
    photo?: string
    topic: string
    bio?: string
    supervisor: string | PIEntry
    institution?: string
    startDate?: string
    website?: string
  }
}

function isPopulated(sup: string | PIEntry | undefined): sup is PIEntry {
  return !!sup && typeof sup === 'object' && 'data' in sup
}

export default function Fellows() {
  const [fellows, setFellows] = useState<FellowEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/content/fellows?populate=supervisor&sort=name')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setFellows(json.data ?? []))
      .catch(() => setFellows([]))
      .finally(() => setLoading(false))
  }, [])

  const byTopic = fellows.reduce<Record<string, FellowEntry[]>>((acc, f) => {
    const topic = f.data.topic || 'Other'
    ;(acc[topic] ||= []).push(f)
    return acc
  }, {})
  const topics = Object.keys(byTopic).sort()

  return (
    <>
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-4">
              Fellows
            </h1>
            <p className="text-lg text-gray-text">
              PhD students and early-career researchers in the FLUXIONIC network, organised by research topic and supervisor.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-text">Loading fellows...</div>
            </div>
          ) : fellows.length === 0 ? (
            <p className="text-gray-text py-12 text-center">
              Fellow profiles coming soon.
            </p>
          ) : (
            <div className="space-y-16">
              {topics.map((topic) => (
                <div key={topic}>
                  <h2 className="text-2xl font-heading font-bold text-dark mb-6 pb-3 border-b border-gray-200">
                    {topic}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {byTopic[topic].map((f) => {
                      const sup = f.data.supervisor
                      const supName = isPopulated(sup) ? sup.data.name : null
                      const supAff = isPopulated(sup) ? sup.data.affiliation : null
                      return (
                        <article
                          key={f.slug}
                          className="bg-light-blue rounded-lg overflow-hidden flex flex-col"
                        >
                          {f.data.photo ? (
                            <img
                              src={f.data.photo}
                              alt={f.data.name}
                              className="w-full aspect-square object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                              <GraduationCap className="text-primary/40 w-16 h-16" />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-heading font-semibold text-lg text-dark mb-1">
                              {f.data.name}
                            </h3>
                            {supName && (
                              <p className="text-sm text-primary mb-2">
                                Supervised by {supName}
                                {supAff && <span className="text-gray-text"> · {supAff}</span>}
                              </p>
                            )}
                            {f.data.institution && (
                              <p className="text-xs text-gray-text flex items-center gap-1 mb-3">
                                <MapPin className="w-3 h-3" />
                                {f.data.institution}
                              </p>
                            )}
                            {f.data.bio && (
                              <p className="text-sm text-gray-text line-clamp-4 flex-1">
                                {f.data.bio}
                              </p>
                            )}
                            {f.data.website && (
                              <a
                                href={f.data.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 text-sm text-primary inline-flex items-center gap-1 hover:underline"
                              >
                                Personal page <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
