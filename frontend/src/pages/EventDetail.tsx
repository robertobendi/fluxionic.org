import { useEffect, useState, FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, MapPin, ArrowLeft, ExternalLink, Lock, FileText, Images } from 'lucide-react'

interface Lecture {
  title?: string
  url: string
}

interface EventData {
  title: string
  dateRange?: string
  date: string
  location?: string
  status?: 'upcoming' | 'concluded'
  image?: string
  shortDescription?: string
  description?: string
  link?: string
  gallery?: string[]
  galleryLink?: string
}

export default function EventDetail() {
  const { slug } = useParams()
  const [data, setData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/content/events/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then((json) => setData(json.data?.data ?? null))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <section className="section bg-white">
        <div className="container py-20 text-center text-gray-text animate-pulse">Loading…</div>
      </section>
    )
  }

  if (notFound || !data) {
    return (
      <section className="section bg-white">
        <div className="container text-center py-20">
          <p className="text-gray-text mb-6">Event not found.</p>
          <Link to="/events" className="text-primary hover:underline">
            Back to Events
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-12">
        <div className="container">
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All events
          </Link>
          <div className="md:flex md:items-center md:gap-8">
            {data.image && (
              <div className="md:w-64 md:flex-shrink-0 mb-6 md:mb-0 bg-white rounded-xl p-6 flex items-center justify-center">
                <img src={data.image} alt={data.title} className="max-h-40 w-auto object-contain" />
              </div>
            )}
            <div>
              <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                {data.status === 'upcoming' ? 'Upcoming' : 'Concluded'}
              </span>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-dark my-3">
                {data.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-text">
                {data.dateRange && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    {data.dateRange}
                  </span>
                )}
                {data.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {data.location}
                  </span>
                )}
              </div>
              {data.link && (
                <a
                  href={data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 btn btn-primary"
                >
                  Registration &amp; details <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container max-w-3xl">
          {data.description && (
            <div className="prose max-w-none mb-10">
              <p className="text-gray-text leading-relaxed whitespace-pre-line">
                {data.description}
              </p>
            </div>
          )}

          {/* Photo gallery */}
          {data.gallery && data.gallery.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-heading font-bold text-dark mb-4">Photo gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.gallery.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                    <img
                      src={src}
                      alt={`${data.title} photo ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          {(!data.gallery || data.gallery.length === 0) && data.galleryLink && (
            <a
              href={data.galleryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-10 inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Images className="w-4 h-4" /> View photo gallery
            </a>
          )}

          <LectureVault slug={slug!} />
        </div>
      </section>
    </>
  )
}

/** Password-gated lecture slides (fellows only). */
function LectureVault({ slug }: { slug: string }) {
  const [password, setPassword] = useState('')
  const [lectures, setLectures] = useState<Lecture[] | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${slug}/lectures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.status === 401) {
        setError('Incorrect password.')
        return
      }
      const json = await res.json()
      setLectures((json.lectures ?? []) as Lecture[])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-light-blue/40">
      <h2 className="text-xl font-heading font-bold text-dark mb-1 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" /> Lecture slides
      </h2>
      <p className="text-sm text-gray-text mb-4">
        Slides from this event are available to FLUXIONIC fellows. Enter the shared password to
        access them.
      </p>

      {lectures === null ? (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Checking…' : 'Unlock'}
          </button>
          {error && <span className="text-sm text-red-600 w-full">{error}</span>}
        </form>
      ) : lectures.length === 0 ? (
        <p className="text-sm text-gray-text">No lecture slides have been uploaded for this event.</p>
      ) : (
        <ul className="space-y-2">
          {lectures.map((l, i) => (
            <li key={i}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <FileText className="w-4 h-4" /> {l.title || 'Lecture slides'}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
