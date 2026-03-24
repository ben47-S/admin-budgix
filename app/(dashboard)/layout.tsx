"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { PageLoader } from "@/components/layout/page-loader"
import { adminApi, getToken } from "@/lib/api"

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
  const { isAuthenticated, user, logout, setUser } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Attendre que le composant soit monté côté client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Vérifier s'il y a un token dans le localStorage
    const token = getToken()
    let isCancelled = false

    // Petit délai pour laisser le store se rehydrater
    const timer = setTimeout(() => {
      if (!token || !isAuthenticated || !user || user.role !== "ADMIN") {
        router.push("/login")
        return
      }

      const verifySession = async () => {
        try {
          const response = await adminApi.auth.verify()

          if (isCancelled) return

          if (!response.success) {
            logout()
            router.push("/login")
            return
          }

          if (response.data?.user) {
            setUser(response.data.user)
          }

          setIsChecking(false)
        } catch {
          if (isCancelled) return
          logout()
          router.push("/login")
        }
      }

      verifySession()
    }, 100)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [isMounted, isAuthenticated, user, router, logout, setUser])

  // Afficher un loader pendant la vérification initiale
  if (!isMounted || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Si non authentifié, ne rien afficher (redirection en cours)
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
      <div className="flex h-screen">
        {/* Indicateur de chargement pendant la navigation */}
        <PageLoader />
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-4">{children}</main>
        </div>
        <BottomNav />
      </div>
  )
}

