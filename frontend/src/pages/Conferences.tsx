import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Award, ArrowRight } from 'lucide-react'

export interface ConferenceEntry {
  slug: string
  data: {
    title: string
    dateRange?: string
    date: string
    location?: string
    talk?: string
    poster?: string
    attendees?: string
    awards?: string
    galleryLink?: string
  }
}

export default function Conferences() {
  const [items, setItems] = useState<ConferenceEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/content/conferences?sort=-date&limit=100')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setItems(json.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-4">
              Conferences &amp; Workshops
            </h1>
            <p className="text-lg text-gray-text">
              Talks, posters and meetings where FLUXIONIC fellows and PIs have presented their work.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-text">Loading…</div>
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-text py-12 text-center">Nothing to show yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((c) => (
                <Link
                  key={c.slug}
                  to={`/conferences/${c.slug}`}
                  className="group bg-gradient-to-br from-white to-light-blue/40 border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all flex flex-col"
                >
                  <h3 className="font-heading font-bold text-dark mb-3 group-hover:text-primary transition-colors line-clamp-3">
                    {c.data.title}
                  </h3>
                  <div className="flex flex-col gap-1.5 text-sm text-gray-text mb-4">
                    {c.data.dateRange && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.data.dateRange}
                      </span>
                    )}
                    {c.data.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {c.data.location}
                      </span>
                    )}
                  </div>
                  {c.data.awards && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-2.5 py-1 mb-4 w-fit">
                      <Award className="w-3.5 h-3.5" /> {c.data.awards}
                    </span>
                  )}
                  {c.data.attendees && (
                    <p className="text-xs text-gray-text line-clamp-2 mb-4">{c.data.attendees}</p>
                  )}
                  <span className="inline-flex items-center text-primary text-sm font-medium mt-auto group-hover:gap-2 gap-1 transition-all">
                    Details <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
