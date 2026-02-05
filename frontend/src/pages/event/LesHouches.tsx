import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  BookOpen,
  Building,
  Mail,
  ExternalLink,
  ChevronUp,
  Menu,
  X
} from 'lucide-react'

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'practical', label: 'Practical Information' },
  { id: 'lectures', label: 'Lectures & Seminars' },
  { id: 'leshouches', label: 'Les Houches School' },
  { id: 'registration', label: 'Registration' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'contact', label: 'Contact' },
]

export default function LesHouches() {
  const [activeSection, setActiveSection] = useState('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)

      const sections = navItems.map(item => document.getElementById(item.id))
      const scrollPos = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(navItems[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-dark to-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-xs text-gray-400 hover:text-white">
                ← Fluxionic
              </Link>
              <span className="text-gray-600">|</span>
              <span className="font-heading font-bold text-sm md:text-base">Les Houches 2026</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <nav className="lg:hidden pb-4 border-t border-gray-700">
              <div className="flex flex-col gap-1 pt-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`px-4 py-2 text-left text-sm rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-16">
        <div className="relative text-white py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <img src="/images/les-houches-mountains.png" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/70 to-dark/90" />
          </div>
          <div className="max-w-5xl mx-auto px-4 relative">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
                <Calendar className="w-4 h-4" />
                <span>September 14-25, 2026</span>
                <span className="text-gray-400">|</span>
                <MapPin className="w-4 h-4" />
                <span>Les Houches, France</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4">
                Nonequilibrium Physics<br />in Nanoconfinement
              </h1>
              <p className="text-xl md:text-2xl text-primary-light font-medium mb-8">
                Les Houches - WE Heraeus School
              </p>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                Controlling transport of fluids and charged particles in nanoscale confinement
                is a key challenge in many areas of science and engineering. In extreme confinement,
                the conventional macroscopic description of transport breaks down and fundamentally
                new approaches connecting atomistic description with experimental observations are required.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => scrollToSection('registration')}
                  className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/30"
                >
                  Register Now
                </button>
                <button
                  onClick={() => scrollToSection('practical')}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
          <div className="grid md:grid-cols-3 gap-6">
            <InfoCard
              icon={<Calendar className="w-6 h-6" />}
              title="Dates"
              description="September 14-25, 2026"
            />
            <InfoCard
              icon={<Users className="w-6 h-6" />}
              title="Registration Deadline"
              description="March 16th, 2026"
            />
            <InfoCard
              icon={<MapPin className="w-6 h-6" />}
              title="Location"
              description="Les Houches, French Alps"
            />
          </div>
        </div>

        {/* Description */}
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="prose prose-lg max-w-none text-gray-text space-y-6">
            <p>
              During the past century, significant progress has been made in expanding our atomistic
              understanding of systems in equilibrium. However, to understand life and much of the
              technology that sustains life, we need to be able to understand and control non-equilibrium
              processes. The past two decades have witnessed a paradigm shift away from studying equilibrium
              behaviour to the study of spatial and temporal organisation far from equilibrium.
            </p>
            <p>
              This development is not just driven by scientific curiosity but by the realisation that a
              sustainable society is one that minimises waste in the form of heat and materials. To achieve
              these goals, we need to understand how living organisms combine robustness with selectivity
              and energy efficiency, and we have to learn how to transpose the underlying biological design
              principles to processes with inanimate, nano-scale building blocks.
            </p>
            <p>
              Recent developments in the design of nano-pores have demonstrated that very large gains in
              the separation efficiency are possible by an appropriate nano-scale functionalization of the
              channels through which transport takes place. Transport through nano-pores is almost always
              coupled transport, coupling fluxes that would be independent in bulk materials.
            </p>

            <div className="bg-gradient-to-br from-light-blue to-white p-8 rounded-2xl my-8">
              <h3 className="text-xl font-heading font-bold text-dark mb-4">Key Research Areas</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Fluid flow:</strong> effects of confinement on mass transport, fluid viscosity, surface friction, phoretic flows.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Charge flow:</strong> dynamics of free/polarisation charges in confinement, effect of externally applied static and oscillating electric fields, linear and non-linear dielectric properties, ionic/polarisation currents.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Reactivity:</strong> surface effects, chemical reactions, activation, confinement-specific bond formation/dissociation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Practical Information */}
      <section id="practical" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <SectionTitle icon={<BookOpen />} title="Practical Information" />

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-heading font-bold text-dark mb-4">Key Dates</h3>
              <ul className="space-y-4">
                <DateItem date="January 4, 2026" event="Registration opens" />
                <DateItem date="March 16, 2026" event="Registration deadline" highlight />
                <DateItem date="April 8, 2026" event="Notification of acceptance" />
                <DateItem date="September 14, 2026" event="School begins (arrival day)" />
                <DateItem date="September 25, 2026" event="School ends (morning session)" />
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-heading font-bold text-dark mb-4">Fees & Support</h3>
              <div className="space-y-4 text-gray-text">
                <p>
                  <span className="text-3xl font-bold text-dark">€950</span>
                  <span className="text-sm ml-2">participation fee</span>
                </p>
                <p className="text-sm">Includes lodging and meals for the entire school period.</p>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm">
                    <strong className="text-dark">Financial support available:</strong> We can waive
                    participation fees for a number of applicants. Indicate your need in the application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm mt-8">
            <h3 className="text-xl font-heading font-bold text-dark mb-4">Important Information</h3>
            <ul className="space-y-3 text-gray-text">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Registration is through the CECAM website as part of the CECAM Flagship Program.
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Each participant is expected to present a poster on their current research work.
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                The School opens at 15:00 on September 14th — please do not arrive earlier.
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                On the last day, bedrooms must be vacated by 9:00 AM.
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                It is not possible to extend your stay before or after the indicated dates.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Lectures and Seminars */}
      <section id="lectures" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <SectionTitle icon={<Users />} title="Lectures & Seminars" />

          <p className="text-gray-text text-lg mt-8 mb-12 max-w-3xl">
            The school will host top international speakers who will cover the fundamental physics
            of nanoscale transport, experimental, theoretical and computational methods, and conduct
            in-depth discussions of the open challenges in the field.
          </p>

          <h3 className="text-xl font-heading font-bold text-dark mb-6">Confirmed Speakers</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {speakers.map((speaker) => (
              <div key={speaker.name} className="bg-gradient-to-br from-light-blue/50 to-white p-4 rounded-xl">
                <p className="font-medium text-dark">{speaker.name}</p>
                <p className="text-sm text-gray-text">{speaker.affiliation}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-light-blue/30 p-8 rounded-2xl mt-12">
            <h3 className="text-xl font-heading font-bold text-dark mb-4">Program Structure</h3>
            <p className="text-gray-text mb-4">
              The school will be structured around the three physical processes pertinent to nanoscale
              transport: fluid flow, charge flow, and reactivity. We will organize core blocks of lectures
              covering:
            </p>
            <ul className="grid md:grid-cols-2 gap-3 text-gray-text">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Fundamental theoretical concepts of nanofluidics
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Multiscale computational approaches
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Experimental techniques
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Nanomaterials production and characterization
              </li>
            </ul>
            <p className="text-sm text-gray-text mt-6 italic">
              The detailed program will be announced soon.
            </p>
          </div>
        </div>
      </section>

      {/* Les Houches School */}
      <section id="leshouches" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <SectionTitle icon={<Building />} title="Les Houches School of Physics" />

          <div className="grid md:grid-cols-2 gap-12 mt-12 items-center">
            <div>
              <p className="text-gray-text leading-relaxed mb-6">
                Les Houches is a village located in Chamonix valley, in the French Alps. Established
                in 1951, the Les Houches Physics School is situated at 1150 m above sea level in
                natural surroundings, with breathtaking views on the Mont-Blanc mountain range.
              </p>
              <p className="text-gray-text leading-relaxed mb-6">
                Les Houches Physics School belongs to the Université Grenoble Alpes (UGA). The 5
                School Partners are UGA, the Institut National Polytechnique (Grenoble-INP), the
                Centre National de la Recherche Scientifique (CNRS), the Commissariat à l'Energie
                Atomique (CEA), and the Ecole Normale Supérieure de Lyon (ENS Lyon).
              </p>
              <div className="bg-white p-6 rounded-xl">
                <p className="font-medium text-dark mb-2">Ecole de Physique des Houches</p>
                <p className="text-sm text-gray-text">
                  149 Chemin de la Côte<br />
                  F-74310 Les Houches, France
                </p>
                <a
                  href="https://www.houches-school-physics.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mt-4 text-sm font-medium"
                >
                  Visit website <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img
                src="/images/les-houches-mountains.png"
                alt="Mont Blanc mountain range from Les Houches"
                className="w-full h-48 object-cover rounded-t-2xl"
              />
              <div className="bg-gradient-to-br from-primary/10 to-light-blue p-8 text-center rounded-b-2xl">
                <img src="/images/sponsors/eph-logo.jpg" alt="École de Physique des Houches" className="h-16 object-contain mx-auto mb-4" />
                <p className="text-2xl font-heading font-bold text-dark">1150m</p>
                <p className="text-gray-text">above sea level</p>
                <p className="text-sm text-gray-text mt-2">French Alps • Chamonix Valley</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration */}
      <section id="registration" className="py-20 bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Registration</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Registration is through the CECAM website. You will need to create a CECAM account
            if you don't have one. As part of your application, please provide a motivation letter
            and a reference letter.
          </p>
          <a
            href="https://www.cecam.org/workshop-details/nonequilibrium-physics-in-nanoconfinement-1473"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
          >
            Register on CECAM
            <ExternalLink className="w-5 h-5" />
          </a>
          <p className="text-sm text-white/70 mt-6">
            Registration deadline: March 16th, 2026
          </p>
        </div>
      </section>

      {/* Sponsors */}
      <section id="sponsors" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <SectionTitle icon={<Building />} title="Sponsors" />

          <div className="mt-12 space-y-8">
            <div className="text-center">
              <p className="text-gray-text mb-8">
                The event is generously sponsored by the Wilhelm and Else Heraeus Foundation.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-12">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <img src="/images/sponsors/heraeus.png" alt="Wilhelm und Else Heraeus-Stiftung" className="h-16 object-contain" />
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <img src="/images/sponsors/eph-logo.jpg" alt="École de Physique des Houches" className="h-16 object-contain" />
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <img src="/images/sponsors/cecam-fr-ra.png" alt="CECAM-FR-RA" className="h-16 object-contain" />
                </div>
              </div>
            </div>

            <div className="text-center text-gray-text space-y-2 pt-8 border-t">
              <p>
                The school is a part of PhD training program of the research-training network{' '}
                <a href="/" className="text-primary hover:text-primary-dark font-medium">
                  DN-FLUXIONIC
                </a>.
              </p>
              <p>
                The school is a part of the{' '}
                <a
                  href="https://www.cecam.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  CECAM Flagship Program
                </a>{' '}
                through the{' '}
                <a
                  href="https://fr-ra.cecam.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  CECAM-FR-RA node
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <SectionTitle icon={<Mail />} title="Contact" />

          <p className="text-gray-text mt-8 mb-8">
            For any further inquiries, please contact us through the CECAM website.
          </p>
          <a
            href="https://www.cecam.org/workshop-details/nonequilibrium-physics-in-nanoconfinement-1473"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            Contact via CECAM <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Les Houches - WE Heraeus School •{' '}
            <Link to="/" className="text-primary hover:text-primary-light">
              FLUXIONIC
            </Link>
          </p>
        </div>
      </footer>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-110 z-40"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white">
        {icon}
      </div>
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-dark">{title}</h2>
    </div>
  )
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-light-blue rounded-xl flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-heading font-bold text-dark mb-1">{title}</h3>
      <p className="text-gray-text">{description}</p>
    </div>
  )
}

function DateItem({ date, event, highlight }: { date: string; event: string; highlight?: boolean }) {
  return (
    <li className={`flex items-center justify-between p-3 rounded-lg ${highlight ? 'bg-primary/10' : 'bg-gray-50'}`}>
      <span className="text-gray-text">{event}</span>
      <span className={`font-medium ${highlight ? 'text-primary' : 'text-dark'}`}>{date}</span>
    </li>
  )
}

const speakers = [
  { name: 'Lydéric Bocquet', affiliation: 'École Normale Supérieure-PSL' },
  { name: 'Daan Frenkel', affiliation: 'University of Cambridge' },
  { name: 'Mischa Bonn', affiliation: 'MPI for Polymer Research' },
  { name: 'Radha Boya', affiliation: 'University of Manchester' },
  { name: 'Ying Jiang', affiliation: 'Peking University, Beijing' },
  { name: 'Alexandre Tkachenko', affiliation: 'Université du Luxembourg' },
  { name: 'Angelos Michaelides', affiliation: 'University of Cambridge' },
  { name: 'Benjamin Rotenberg', affiliation: 'Sorbonne University' },
  { name: 'Roland Netz', affiliation: 'Freie Universität Berlin' },
  { name: 'Gabor Csanyi', affiliation: 'University of Cambridge' },
  { name: 'David Limmer', affiliation: 'UC Berkeley' },
  { name: 'Erika Eiser', affiliation: 'NTNU' },
  { name: 'Celine Merlet', affiliation: 'University of Toulouse' },
  { name: 'Claire Chassagne', affiliation: 'TU Delft' },
  { name: 'Marialore Sulpizi', affiliation: 'Ruhr Universität Bochum' },
  { name: 'Marie-Laure Bocquet', affiliation: 'École Normale Supérieure-PSL' },
  { name: 'Susan Perkin', affiliation: 'University of Oxford' },
  { name: 'Nikita Kavokine', affiliation: 'EPFL' },
  { name: 'Rene van Roij', affiliation: 'University of Utrecht' },
  { name: 'Patrick Warren', affiliation: 'STFC' },
  { name: 'Chiara Gattinoni', affiliation: "King's College" },
]
