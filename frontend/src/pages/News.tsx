import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface NewsEntry {
  slug: string
  data: {
    title: string
    summary: string
    image?: string
    date: string
  }
  createdAt: string
}

export default function News() {
  const [news, setNews] = useState<NewsEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/content/news')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setNews(json.data ?? []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="section bg-white">
      <div className="container">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-8">
          News
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-gray-text">Loading news...</div>
          </div>
        ) : news.length === 0 ? (
          <p className="text-gray-text py-12">
            No news articles yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((entry) => (
              <Link
                key={entry.slug}
                to={`/news/${entry.slug}`}
                className="group bg-light-blue rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {entry.data.image ? (
                  <img
                    src={entry.data.image}
                    alt={entry.data.title}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <span className="text-primary/40 text-sm">News</span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-gray-text mb-2">
                    {new Date(entry.data.date || entry.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <h2 className="font-heading font-semibold text-lg text-dark group-hover:text-primary transition-colors mb-2">
                    {entry.data.title}
                  </h2>
                  {entry.data.summary && (
                    <p className="text-sm text-gray-text line-clamp-3">
                      {entry.data.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
