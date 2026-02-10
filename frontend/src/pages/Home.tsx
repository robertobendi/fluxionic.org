import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Instagram } from 'lucide-react'
import HeroAnimation from '../components/HeroAnimation'

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

interface InstagramPost {
  id: string
  caption: string
  mediaType: string
  mediaUrl: string
  thumbnailUrl: string
  permalink: string
  timestamp: string
}

export default function Home() {
  const [news, setNews] = useState<NewsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [igPosts, setIgPosts] = useState<InstagramPost[]>([])

  useEffect(() => {
    fetch('/api/content/news?limit=4')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setNews(json.data ?? []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false))

    fetch('/api/instagram/feed')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setIgPosts(json.data ?? []))
      .catch(() => setIgPosts([]))
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-light-blue to-white py-20 lg:py-32 overflow-hidden">
        <HeroAnimation />
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-dark mb-6">
              <span className="text-primary">Flux</span>ionic
            </h1>
            <p className="text-lg md:text-xl text-gray-text mb-8 leading-relaxed">
              Controlled transport of liquid matter through channels with dimensions from
              Angstroms to nanometres promises huge technological and socio-economical impact.
              At these scales, however, unconventional physics emerges due to enhanced fluctuations,
              prevalence of surfaces and granularity of matter. Novel experimental and computational
              approaches are then needed. Fluxionics will ensure the concerted development of these
              approaches and their application to exciting systems. The project will also train
              future scientific leaders in the rapidly growing field of nanofluidics.
            </p>
            <Link to="/project" className="btn btn-primary">
              Learn more
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* News Section - only shown when there are articles */}
      {!loading && news.length > 0 && (
        <section className="section bg-white">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">
                Latest News
              </h2>
              <Link
                to="/news"
                className="text-primary hover:text-primary-dark font-medium inline-flex items-center"
              >
                View all news
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
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
                  <div className="p-4">
                    <p className="text-xs text-gray-text mb-1">
                      {new Date(entry.data.date || entry.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <h3 className="font-heading font-semibold text-dark group-hover:text-primary transition-colors line-clamp-2">
                      {entry.data.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram Section - only shown when there are posts */}
      {igPosts.length > 0 && (
        <section className="section bg-gradient-to-b from-white to-light-blue/30">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-4">
                Follow Us on Instagram
              </h2>
              <a
                href="https://www.instagram.com/fluxionic_msca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark font-medium inline-flex items-center"
              >
                <Instagram className="mr-2 h-5 w-5" />
                @fluxionic_msca
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {igPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  <img
                    src={post.mediaType === 'VIDEO' ? post.thumbnailUrl : post.mediaUrl}
                    alt={post.caption.slice(0, 100)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <p className="text-white text-sm p-3 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-3">
                      {post.caption}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partner Logos Section */}
      <section className="section bg-light-blue">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow h-24 w-full"
                title={partner.name}
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-16 max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}

const partners = [
  {
    name: 'University of Barcelona',
    logo: '/logos/ub.png',
  },
  {
    name: 'Ruhr Universitat Bochum',
    logo: '/logos/rub.png',
  },
  {
    name: 'TU Delft',
    logo: '/logos/tudelft.png',
  },
  {
    name: 'CNRS',
    logo: '/logos/cnrs.png',
  },
  {
    name: 'EPFL',
    logo: '/logos/epfl.png',
  },
  {
    name: 'NTNU',
    logo: '/logos/ntnu.png',
  },
  {
    name: 'University of Oxford',
    logo: '/logos/oxford.jpg',
  },
  {
    name: 'Freie Universitat Berlin',
    logo: '/logos/fub.jpg',
  },
  {
    name: 'University of Cambridge',
    logo: '/logos/cambridge.jpg',
  },
  {
    name: 'Max Planck Institute',
    logo: '/logos/mpi.png',
  },
  {
    name: 'Johannes Gutenberg University Mainz',
    logo: '/logos/jgu.png',
  },
  {
    name: 'University of Manchester',
    logo: '/logos/manchester.gif',
  },
]
