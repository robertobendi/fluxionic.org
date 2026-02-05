import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface ArticleData {
  slug: string
  data: {
    title: string
    summary: string
    body: string
    image?: string
    date: string
  }
  createdAt: string
}

export default function NewsArticle() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/content/news/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((json) => setArticle(json.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <section className="section bg-white">
        <div className="container">
          <div className="animate-pulse text-gray-text py-12">Loading article...</div>
        </div>
      </section>
    )
  }

  if (notFound || !article) {
    return (
      <section className="section bg-white">
        <div className="container">
          <p className="text-gray-text mb-4">Article not found.</p>
          <Link to="/news" className="text-primary hover:text-primary-dark font-medium inline-flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to news
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/news"
            className="text-primary hover:text-primary-dark font-medium inline-flex items-center mb-8"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to news
          </Link>

          <p className="text-sm text-gray-text mb-2">
            {new Date(article.data.date || article.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-6">
            {article.data.title}
          </h1>

          {article.data.image && (
            <img
              src={article.data.image}
              alt={article.data.title}
              className="w-full rounded-lg mb-8 object-cover max-h-96"
            />
          )}

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.data.body }}
          />
        </div>
      </div>
    </section>
  )
}
