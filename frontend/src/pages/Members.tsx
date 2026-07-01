import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, GraduationCap } from 'lucide-react'
import {
  institutions,
  fetchFellowsByNode,
  initials,
  type Institution,
  type FellowEntry,
} from '../data/nodes'

export default function Members() {
  const [byNode, setByNode] = useState<Record<string, FellowEntry[]>>({})

  useEffect(() => {
    fetchFellowsByNode().then(setByNode)
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-6">
              Nodes and Researchers
            </h1>
            <p className="text-lg text-gray-text">
              The institutions, principal investigators and doctoral researchers that make up the
              FLUXIONIC network. Select a node to meet its team and read about their projects.
            </p>
          </div>
        </div>
      </section>

      {/* Institutions Grid */}
      <section className="section bg-gradient-to-b from-light-blue/30 to-white">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((institution) => (
              <NodeCard
                key={institution.abbrev}
                institution={institution}
                fellows={byNode[institution.abbrev.toUpperCase()] ?? []}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function NodeCard({ institution, fellows }: { institution: Institution; fellows: FellowEntry[] }) {
  return (
    <Link
      to={`/nodes/${institution.abbrev.toLowerCase()}`}
      className="group bg-gradient-to-br from-white to-light-blue/40 border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading font-bold text-dark mb-1 group-hover:text-primary transition-colors">
            {institution.name}
          </h3>
          <div className="flex items-center text-sm text-gray-text">
            <MapPin className="h-4 w-4 mr-1" />
            {institution.location}, {institution.country}
          </div>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-full">
          {institution.abbrev}
        </span>
      </div>

      <div className="border-t border-gray-200/50 pt-4 mb-4">
        <h4 className="text-xs font-medium text-gray-text uppercase tracking-wide mb-2">
          Principal Investigators
        </h4>
        <p className="text-sm text-dark">{institution.pis.map((p) => p.name).join(', ')}</p>
      </div>

      {fellows.length > 0 && (
        <div className="border-t border-gray-200/50 pt-4 mt-auto">
          <h4 className="text-xs font-medium text-gray-text uppercase tracking-wide mb-3">
            Doctoral Researchers
          </h4>
          <div className="flex items-center gap-2">
            {fellows.slice(0, 5).map((f) => (
              <div
                key={f.slug}
                className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-medium"
                title={f.data.name}
              >
                {f.data.photo ? (
                  <img src={f.data.photo} alt={f.data.name} className="w-full h-full object-cover" />
                ) : (
                  initials(f.data.name)
                )}
              </div>
            ))}
            {fellows.length > 5 && (
              <span className="text-xs text-gray-text">+{fellows.length - 5}</span>
            )}
          </div>
        </div>
      )}

      <span className="inline-flex items-center text-primary text-sm font-medium mt-4 group-hover:gap-2 gap-1 transition-all">
        {fellows.length > 0 ? (
          <>
            <GraduationCap className="w-4 h-4" /> View node &amp; projects
          </>
        ) : (
          'View node'
        )}
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  )
}
