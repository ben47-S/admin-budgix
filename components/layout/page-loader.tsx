"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Composant d'indicateur de chargement pendant la navigation
 * Affiche une barre de progression en haut de la page lors des changements de route
 */
export function PageLoader() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Démarrer le chargement quand le pathname change
    setIsLoading(true)
    setProgress(0)

    // Simuler une progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 50)

    // Terminer le chargement après un court délai
    const timer = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 200)
    }, 300)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          transition: "width 0.2s ease-out",
        }}
      />
    </div>
  )
}

