export default function Project() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-light-blue to-white py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-6">
              Project
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-heading font-bold text-dark mb-6">Summary</h2>

            <div className="space-y-6 text-gray-text leading-relaxed">
              <p>
                Controlling transport of liquid matter through channels with dimensions from
                Ångströms to nanometres is a key challenge in many areas of science and engineering.
                However, progress in this field is hampered by our lack of understanding, as the
                conventional macroscopic description of transport phenomena breaks down.
              </p>

              <p>
                The transition to studying nanoscale systems is not simply a matter of scaling down
                the approaches and methods that work for microscopic counterparts: at the nanoscale,
                new physics emerges due to the enhanced fluctuations, prevalence of surfaces and
                granularity of the matter at this scale.
              </p>

              <p>
                Therefore, the atomistic description becomes crucial, and novel simulation and
                experimental tools need to be developed coupling quantum-level and force-field
                molecular simulations to mesoscale modelling based on continuum hydrodynamics,
                and to experiments that can probe such nanoscale effects.
              </p>

              <p>
                The emerging field promises huge technological and socio-economic impact. However,
                it is essential to train a new generation of early-stage researchers in the diverse
                skills that are needed to develop and apply precisely controlled nanofluidic mass transport.
              </p>

              <p>
                This, in a few words, is the aim of FLUXIONIC program: bridging Physics, Chemistry,
                Materials Science, and emerging nanoscale technologies.
              </p>

              <p>
                Recent exciting developments in experimental and theoretical methods to study transport
                of fluids and charged particles at the nanoscale mean that we are now at a stage where
                exploration of key processes is viable and fundamental and applied breakthroughs can be
                expected from our research program, which is probing different aspects of non-equilibrium
                physics in nanoconfinement:
              </p>

              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>Fluid flow:</strong> effects of confinement on mass transport, fluid viscosity,
                  surface friction, phoretic flows.
                </li>
                <li>
                  <strong>Charge flow:</strong> dynamics of free/polarisation charges in confinement,
                  effect of externally applied static and oscillating electric fields, linear and
                  non-linear dielectric properties, ionic/polarisation currents.
                </li>
                <li>
                  <strong>Reactivity:</strong> surface effects, chemical reactions, activation,
                  confinement-specific bond formation/dissociation.
                </li>
              </ul>
            </div>

            {/* Diagram */}
            <div className="my-12">
              <img
                src="/images/work-packages.png"
                alt="FLUXIONIC Work Packages - Understand and control transport of nanoconfined fluids"
                className="w-full h-auto"
              />
            </div>

            <div className="space-y-6 text-gray-text leading-relaxed">
              <p className="italic text-lg text-dark border-l-4 border-primary pl-6 py-2">
                We will train young researchers for future leadership in the rapidly growing fields
                of nanotechnology with strong impacts on core challenges of modern society: clean water,
                disease treatment, sustainable production, storage and usage of energy.
              </p>

              <p>
                We created the network comprising academic and private partners from 7 European countries
                with the major objective to offer an integrated training and a strong program of secondments
                to young researchers. FLUXIONIC will provide a balanced and timely supra-disciplinary
                training delivered by internationally leading scientists, with seamless opportunities
                to move between industry and academia.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
