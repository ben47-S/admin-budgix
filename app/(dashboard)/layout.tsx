"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { PageLoader } from "@/components/layout/page-loader"

/**
 * Layout pour les pages du dashboard admin
 * Vérifie l'authentification et redirige vers /login si nécessaire
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Attendre que le store soit hydraté avant de vérifier l'auth
    if (!_hasHydrated) {
      return
    }

    // Vérifier l'authentification au chargement
    if (!isAuthenticated || !user || user.role !== "ADMIN") {
      router.push("/login")
      return
    }

    // Si authentifié, on peut afficher le dashboard
    setIsChecking(false)
  }, [isAuthenticated, user, _hasHydrated, router])

  // Afficher un loader pendant l'hydratation ou la vérification
  if (!_hasHydrated || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Si non authentifié après hydratation, ne rien afficher (redirection en cours)
  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Indicateur de chargement pendant la navigation */}
      <PageLoader />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

