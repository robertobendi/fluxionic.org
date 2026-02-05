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
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FLUXIONIC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
