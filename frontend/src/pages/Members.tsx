import { MapPin } from 'lucide-react'

interface PI {
  name: string
  photo?: string
}

interface Institution {
  name: string
  abbrev: string
  location: string
  country: string
  pis: PI[]
  associates?: string[]
}

const institutions: Institution[] = [
  {
    name: 'University of Barcelona',
    abbrev: 'UB',
    location: 'Barcelona',
    country: 'Spain',
    pis: [
      { name: 'Ignacio Pagonabarraga', photo: '/pis/pagonabarraga.jpg' },
      { name: 'Jure Dobnikar', photo: '/pis/dobnikar.jpg' },
    ],
  },
  {
    name: 'CNRS Paris',
    abbrev: 'CNRS',
    location: 'Paris',
    country: 'France',
    pis: [
      { name: 'Marie-Laure Bocquet', photo: '/pis/ml-bocquet.jpg' },
      { name: 'Lyderic Bocquet', photo: '/pis/l-bocquet.jpg' },
      { name: 'Benjamin Rotenberg', photo: '/pis/rotenberg.jpg' },
      { name: 'Emmanuel Trizac', photo: '/pis/trizac.jpg' },
    ],
    associates: ['Ecole Normale Superieure-PSL', 'Universite Sorbonne', 'Universite Paris-Saclay'],
  },
  {
    name: 'Ruhr Universitat Bochum',
    abbrev: 'RUB',
    location: 'Bochum',
    country: 'Germany',
    pis: [
      { name: 'Marialore Sulpizi', photo: '/pis/sulpizi.jpg' },
    ],
  },
  {
    name: 'Freie Universitat Berlin',
    abbrev: 'FUB',
    location: 'Berlin',
    country: 'Germany',
    pis: [
      { name: 'Roland Netz', photo: '/pis/netz.jpg' },
    ],
  },
  {
    name: 'Max Planck Gesellschaft',
    abbrev: 'MPG',
    location: 'Mainz',
    country: 'Germany',
    pis: [
      { name: 'Mischa Bonn', photo: '/pis/bonn.jpg' },
    ],
  },
  {
    name: 'Sweetch Energy',
    abbrev: 'SWEETCH',
    location: 'Paris',
    country: 'France',
    pis: [
      { name: 'Pascal Le Melinaire', photo: '/pis/lemelinaire.jpg' },
    ],
  },
  {
    name: 'Norges Teknisk-Naturvitenskapelige Universitet',
    abbrev: 'NTNU',
    location: 'Trondheim',
    country: 'Norway',
    pis: [
      { name: 'Erika Eiser', photo: '/pis/eiser.jpg' },
    ],
  },
  {
    name: 'TU Delft',
    abbrev: 'TUD',
    location: 'Delft',
    country: 'Netherlands',
    pis: [
      { name: 'Claire Chassagne', photo: '/pis/chassagne.jpg' },
      { name: 'Remco Hartkamp', photo: '/pis/hartkamp.jpg' },
    ],
  },
  {
    name: 'University of Cambridge',
    abbrev: 'UCAM',
    location: 'Cambridge',
    country: 'United Kingdom',
    pis: [
      { name: 'Angelos Michaelides', photo: '/pis/michaelides.jpg' },
      { name: 'Daan Frenkel', photo: '/pis/frenkel.jpg' },
    ],
  },
  {
    name: 'University of Manchester',
    abbrev: 'UNIMAN',
    location: 'Manchester',
    country: 'United Kingdom',
    pis: [
      { name: 'Radha Boya', photo: '/pis/boya.jpg' },
    ],
  },
  {
    name: 'University of Oxford',
    abbrev: 'UOXF',
    location: 'Oxford',
    country: 'United Kingdom',
    pis: [
      { name: 'Susan Perkin', photo: '/pis/perkin.jpg' },
    ],
  },
  {
    name: 'Ecole Polytechnique Federale de Lausanne',
    abbrev: 'EPFL',
    location: 'Lausanne',
    country: 'Switzerland',
    pis: [
      { name: 'Michele Ceriotti', photo: '/pis/ceriotti.jpg' },
      { name: 'Sara Bonella', photo: '/pis/bonella.jpg' },
    ],
  },
]

export default function Members() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-light-blue via-light-blue/70 to-light-blue/30 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-6">
              Member Institutions and PIs
            </h1>
          </div>
        </div>
      </section>

      {/* Institutions Grid */}
      <section className="section bg-gradient-to-b from-light-blue/30 to-white">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((institution) => (
              <InstitutionCard key={institution.abbrev} institution={institution} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function InstitutionCard({ institution }: { institution: Institution }) {
  return (
    <div className="bg-gradient-to-br from-white to-light-blue/40 border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading font-bold text-dark mb-1">
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

      {institution.associates && institution.associates.length > 0 && (
        <div className="mb-4 text-sm text-gray-text">
          <span className="font-medium">Associated: </span>
          {institution.associates.join(', ')}
        </div>
      )}

      <div className="border-t border-gray-200/50 pt-4">
        <h4 className="text-sm font-medium text-dark mb-3">Principal Investigators</h4>
        <div className="space-y-3">
          {institution.pis.map((pi) => (
            <div key={pi.name} className="flex items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0 ring-2 ring-primary/20">
                {pi.photo ? (
                  <img
                    src={pi.photo}
                    alt={pi.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white font-medium">${pi.name.split(' ').pop()?.charAt(0)}</div>`
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white font-medium">
                    {pi.name.split(' ').pop()?.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sm text-dark">{pi.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
