import { ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-12">
      <div className="container">
        <div className="text-center">
          <p className="text-sm text-gray-300 mb-4">
            This project has received funding from the European Union's Horizon Europe
            research and innovation programme under the Marie Sklodowska-Curie grant
            agreement No 101119598.
          </p>
          <div className="flex justify-center items-center gap-6 mb-6">
            <img
              src="/eu-flag.svg"
              alt="European Union Flag"
              className="h-16 rounded"
            />
          </div>
          <a
            href="https://linktr.ee/fluxionic_msca"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-gray-300 rounded-full border border-gray-600 hover:border-primary hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Linktree
          </a>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FLUXIONIC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
