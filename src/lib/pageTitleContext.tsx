'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const PageTitleContext = createContext<{ title: string | null; setTitle: (t: string | null) => void }>({
  title: null,
  setTitle: () => {},
})

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitleOverride() {
  return useContext(PageTitleContext)
}

/** Las páginas que cargan su propio nombre por id lo anuncian con este hook,
 *  para que el TopBar lo muestre en vez del id crudo de la URL. Se limpia solo al desmontar. */
export function useSetPageTitle(title: string | null) {
  const { setTitle } = usePageTitleOverride()
  useEffect(() => {
    setTitle(title)
    return () => setTitle(null)
  }, [title, setTitle])
}
