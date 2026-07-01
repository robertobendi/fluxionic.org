import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, MapPin, ArrowLeft, Award, Mic, FileText, Users, Images } from 'lucide-react'

interface ConferenceData {
  title: string
  dateRange?: string
  location?: string
  talk?: string
  poster?: string
  attendees?: string
  awards?: string
  gallery?: string[]
  galleryLink?: string
}

export default function ConferenceDetail() {
  const { slug } = useParams()
  const [data, setData] = useState<ConferenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/content/conferences/${slug}`)
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
          <p className="text-gray-text mb-6">Conference not found.</p>
          <Link to="/conferences" className="text-primary hover:underline">
            Back to Conferences &amp; Workshops
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-12">
        <div className="container max-w-3xl">
          <Link
            to="/conferences"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All conferences &amp; workshops
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">
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
          {data.awards && (
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-full px-3 py-1">
              <Award className="w-4 h-4" /> {data.awards}
            </span>
          )}
        </div>
      </section>

      <section className="section bg-white">
        <div className="container max-w-3xl space-y-8">
          {data.talk && (
            <Detail icon={<Mic className="w-5 h-5 text-primary" />} label="Talk">
              {data.talk}
            </Detail>
          )}
          {data.poster && (
            <Detail icon={<FileText className="w-5 h-5 text-primary" />} label="Poster">
              {data.poster}
            </Detail>
          )}
          {data.attendees && (
            <Detail icon={<Users className="w-5 h-5 text-primary" />} label="Fellows &amp; PIs">
              {data.attendees}
            </Detail>
          )}

          {data.gallery && data.gallery.length > 0 && (
            <div>
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
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Images className="w-4 h-4" /> View photo gallery
            </a>
          )}
        </div>
      </section>
    </>
  )
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-text uppercase tracking-wide mb-2 flex items-center gap-2">
        {icon} {label}
      </h2>
      <p className="text-gray-text leading-relaxed">{children}</p>
    </div>
  )
}
