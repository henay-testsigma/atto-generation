import { useEffect, useState } from 'react'
import { PrototypeApp } from './prototype/PrototypeApp'
import { CatalogPage } from './prototype/catalog/CatalogPage'

/** Tiny dependency-free router: pathname → page, updated on back/forward. */
function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

function App() {
  const path = usePath()
  if (path.startsWith('/catalog')) return <CatalogPage />
  return <PrototypeApp />
}

export default App
