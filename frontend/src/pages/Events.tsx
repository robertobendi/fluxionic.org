import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'

export interface EventEntry {
  slug: string
  data: {
    title: string
    dateRange?: string
    date: string
    location?: string
    status?: 'upcoming' | 'concluded'
    image?: string
    shortDescription?: string
    description?: string
    link?: string
  }
}

export default function Events() {
  const [events, setEvents] = useState<EventEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/content/events?sort=-date&limit=100')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setEvents(json.data ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  const upcoming = events
    .filter((e) => e.data.status === 'upcoming')
    .sort((a, b) => a.data.date.localeCompare(b.data.date))
  const concluded = events
    .filter((e) => e.data.status !== 'upcoming')
    .sort((a, b) => b.data.date.localeCompare(a.data.date))

  return (
    <>
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-4">Events</h1>
            <p className="text-lg text-gray-text">
              Schools, workshops and conferences organised by the FLUXIONIC network
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-text">Loading events…</div>
            </div>
          ) : events.length === 0 ? (
            <p className="text-gray-text py-12 text-center">Events coming soon.</p>
          ) : (
            <>
              <h2 className="text-2xl font-heading font-bold text-dark mb-8">Upcoming Events</h2>
              {upcoming.length > 0 ? (
                <div className="space-y-6">
                  {upcoming.map((e) => (
                    <EventCard key={e.slug} event={e} featured />
                  ))}
                </div>
              ) : (
                <p className="text-gray-text">No upcoming events at the moment.</p>
              )}

              <hr className="my-12 border-gray-200" />

              <h2 className="text-2xl font-heading font-bold text-dark mb-8">Concluded Events</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {concluded.map((e) => (
                  <EventCard key={e.slug} event={e} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

function EventCard({ event, featured }: { event: EventEntry; featured?: boolean }) {
  const d = event.data
  const blurb = d.shortDescription || d.description
  if (featured) {
    return (
      <Link
        to={`/events/${event.slug}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
      >
        <div className="md:flex">
          <div className="md:w-2/5 relative bg-light-blue flex items-center justify-center min-h-[14rem]">
            <img
              src={d.image}
              alt={d.title}
              className="w-full h-56 md:h-full max-h-72 object-contain p-6 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                Upcoming
              </span>
            </div>
          </div>
          <div className="p-8 md:w-3/5 flex flex-col justify-center">
            <h3 className="text-2xl font-heading font-bold text-dark mb-3 group-hover:text-primary transition-colors">
              {d.title}
            </h3>
            {blurb && <p className="text-gray-text mb-4 leading-relaxed line-clamp-3">{blurb}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-gray-text mb-6">
              {d.dateRange && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {d.dateRange}
                </span>
              )}
              {d.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {d.location}
                </span>
              )}
            </div>
            <span className="inline-flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
              View event details <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
    >
      <div className="w-full h-44 bg-light-blue flex items-center justify-center overflow-hidden">
        <img
          src={d.image}
          alt={d.title}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-dark mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {d.title}
        </h3>
        {blurb && <p className="text-sm text-gray-text line-clamp-2 mb-3">{blurb}</p>}
        <div className="flex flex-col gap-1 text-sm text-gray-text">
          {d.dateRange && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {d.dateRange}
            </span>
          )}
          {d.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {d.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
