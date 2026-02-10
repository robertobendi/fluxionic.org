import { Link } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'

interface Event {
  slug: string
  title: string
  subtitle: string
  date: string
  dateRange: string
  location: string
  image: string
  description: string
  status: 'upcoming' | 'past'
}

const events: Event[] = [
  {
    slug: 'les-houches-2026',
    title: 'Nonequilibrium Physics in Nanoconfinement',
    subtitle: 'Les Houches - WE Heraeus School',
    date: '2026-09-14',
    dateRange: 'September 14-25, 2026',
    location: 'Les Houches, French Alps',
    image: '/images/les-houches-mountains.png',
    description:
      'A two-week school covering the fundamental physics of nanoscale transport, experimental, theoretical and computational methods. Part of the CECAM Flagship Program.',
    status: 'upcoming',
  },
]

export default function Events() {
  const upcoming = events.filter((e) => e.status === 'upcoming')
  const past = events.filter((e) => e.status === 'past')

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-4">
              Events
            </h1>
            <p className="text-lg text-gray-text">
              Schools, workshops and conferences organised by the FLUXIONIC network
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <section className="section bg-gradient-to-b from-light-blue/30 to-white">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-dark mb-8">Upcoming Events</h2>
            <div className="space-y-6">
              {upcoming.map((event) => (
                <EventCard key={event.slug} event={event} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <section className="section bg-white">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-dark mb-8">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {past.length === 0 && upcoming.length > 0 && (
        <section className="section bg-white">
          <div className="container text-center">
            <p className="text-gray-text">More events will be announced soon.</p>
          </div>
        </section>
      )}
    </>
  )
}

function EventCard({ event, featured }: { event: Event; featured?: boolean }) {
  if (featured) {
    return (
      <Link
        to={`/events/${event.slug}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
      >
        <div className="md:flex">
          <div className="md:w-2/5 relative">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-56 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                Upcoming
              </span>
            </div>
          </div>
          <div className="p-8 md:w-3/5 flex flex-col justify-center">
            <p className="text-primary font-medium text-sm mb-2">{event.subtitle}</p>
            <h3 className="text-2xl font-heading font-bold text-dark mb-3 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-gray-text mb-4 leading-relaxed">{event.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-text mb-6">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {event.dateRange}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {event.location}
              </span>
            </div>
            <span className="inline-flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
              View event details
              <ArrowRight className="w-4 h-4" />
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
      <img
        src={event.image}
        alt={event.title}
        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="p-5">
        <p className="text-primary font-medium text-xs mb-1">{event.subtitle}</p>
        <h3 className="font-heading font-bold text-dark mb-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1 text-sm text-gray-text">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {event.dateRange}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </span>
        </div>
      </div>
    </Link>
  )
}
