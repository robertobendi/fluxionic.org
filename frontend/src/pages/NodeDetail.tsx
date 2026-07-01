import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, ArrowLeft, ExternalLink } from 'lucide-react'
import {
  institutionByAbbrev,
  initials,
  type FellowEntry,
} from '../data/nodes'

export default function NodeDetail() {
  const { node } = useParams()
  const institution = institutionByAbbrev(node)
  const [fellows, setFellows] = useState<FellowEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/content/fellows?limit=100&sort=name`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const all = (json.data ?? []) as FellowEntry[]
        setFellows(
          all.filter((f) => (f.data.node || '').toUpperCase() === (node || '').toUpperCase())
        )
      })
      .catch(() => setFellows([]))
      .finally(() => setLoading(false))
  }, [node])

  if (!institution) {
    return (
      <section className="section bg-white">
        <div className="container text-center py-20">
          <p className="text-gray-text mb-6">Node not found.</p>
          <Link to="/member-institutions-and-pis" className="text-primary hover:underline">
            Back to Nodes and Researchers
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16">
        <div className="container">
          <Link
            to="/member-institutions-and-pis"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All nodes
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-full">
              {institution.abbrev}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-dark mb-3">
            {institution.name}
          </h1>
          <div className="flex items-center text-gray-text">
            <MapPin className="h-4 w-4 mr-1" />
            {institution.location}, {institution.country}
          </div>
          {institution.associates && institution.associates.length > 0 && (
            <p className="text-sm text-gray-text mt-3">
              <span className="font-medium">Associated: </span>
              {institution.associates.join(', ')}
            </p>
          )}
        </div>
      </section>

      {/* Principal Investigators */}
      <section className="section bg-white">
        <div className="container">
          <h2 className="text-2xl font-heading font-bold text-dark mb-6 pb-3 border-b border-gray-200">
            Principal Investigators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {institution.pis.map((pi) => (
              <div key={pi.name} className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/20 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-medium">
                  {pi.photo ? (
                    <img src={pi.photo} alt={pi.name} className="w-full h-full object-cover" />
                  ) : (
                    initials(pi.name)
                  )}
                </div>
                <span className="text-dark font-medium">{pi.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctoral Researchers */}
      <section className="section bg-gradient-to-b from-light-blue/30 to-white">
        <div className="container">
          <h2 className="text-2xl font-heading font-bold text-dark mb-6 pb-3 border-b border-gray-200">
            Doctoral Researchers
          </h2>
          {loading ? (
            <p className="text-gray-text py-8">Loading…</p>
          ) : fellows.length === 0 ? (
            <p className="text-gray-text py-8">Doctoral researcher profiles coming soon.</p>
          ) : (
            <div className="space-y-8">
              {fellows.map((f) => (
                <article
                  key={f.slug}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden md:flex"
                >
                  <div className="md:w-56 md:flex-shrink-0 bg-light-blue">
                    {f.data.photo ? (
                      <img
                        src={f.data.photo}
                        alt={f.data.name}
                        className="w-full h-56 md:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-56 md:h-full min-h-[14rem] flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white text-4xl font-heading">
                        {initials(f.data.name)}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1">
                    <h3 className="text-xl font-heading font-bold text-dark mb-1">{f.data.name}</h3>
                    <p className="text-primary font-medium text-sm mb-4">{f.data.topic}</p>
                    {f.data.bio && (
                      <p className="text-sm text-gray-text leading-relaxed">{f.data.bio}</p>
                    )}
                    {f.data.website && (
                      <a
                        href={f.data.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Personal page <ExternalLink className="w-3 h-3" />
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
