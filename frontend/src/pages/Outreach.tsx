import { useEffect, useState } from 'react'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'

interface OutreachEntry {
  slug: string
  data: {
    title: string
    date: string
    location?: string
    description?: string
    image?: string
    link?: string
  }
}

export default function Outreach() {
  const [items, setItems] = useState<OutreachEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/content/outreach?sort=-date&limit=100')
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
              Outreach
            </h1>
            <p className="text-lg text-gray-text">
              Public talks, schools, and community events run by the FLUXIONIC network.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-text">Loading outreach activities...</div>
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-text py-12 text-center">
              Outreach activities coming soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <article
                  key={item.slug}
                  className="bg-light-blue rounded-lg overflow-hidden flex flex-col"
                >
                  {item.data.image ? (
                    <img
                      src={item.data.image}
                      alt={item.data.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-primary/5" />
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs text-gray-text flex items-center gap-1 mb-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.data.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <h3 className="font-heading font-semibold text-lg text-dark mb-2">
                      {item.data.title}
                    </h3>
                    {item.data.location && (
                      <p className="text-xs text-gray-text flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3" />
                        {item.data.location}
                      </p>
                    )}
                    {item.data.description && (
                      <p className="text-sm text-gray-text line-clamp-4 flex-1">
                        {item.data.description}
                      </p>
                    )}
                    {item.data.link && (
                      <a
                        href={item.data.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 text-sm text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        Learn more <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
