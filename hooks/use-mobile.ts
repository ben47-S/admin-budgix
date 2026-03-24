"use client"

import { useEffect, useState } from "react"

/**
 * Hook pour détecter si l'utilisateur est sur un appareil mobile
 * Utilise le breakpoint md de Tailwind (768px)
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Détecte le breakpoint md (768px)
    const mediaQuery = window.matchMedia("(max-width: 768px)")

    // Set initial value
    setIsMobile(mediaQuery.matches)

    // Handler pour les changements
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    // Écouter les changements
    mediaQuery.addEventListener("change", handler)

    // Cleanup
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return isMobile
}
