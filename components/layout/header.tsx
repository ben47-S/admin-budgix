"use client"

import { Menu } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useSidebarStore } from "@/store/sidebar-store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

/**
 * Composant Header pour le dashboard admin
 */
export function Header() {
  const { user } = useAuthStore()
  const { toggle } = useSidebarStore()
  const pathname = usePathname()

  // Fonction pour obtenir le titre basé sur le pathname
  const getPageTitle = (path: string): string => {
    // Supprimer les paramètres et les IDs pour la correspondance
    const cleanPath = path.split('/').filter(Boolean).join('/')
    
    // Mapping des chemins vers les titres
    const titleMap: Record<string, string> = {
      "": "Tableau de bord",
      "dashboard": "Tableau de bord",
      "users": "Utilisateurs",
      "payments": "Paiements",
      "notifications": "Notifications",
      "reviews": "Avis",
      "logs": "Journaux",
      "external-subscriptions": "Abonnements externes",
      "categories": "Catégories",
      "support": "Support",
      "stats": "Statistiques",
      "payments-history": "Historique des paiements"
    }

    // Vérifier les chemins spécifiques avec paramètres
    if (path.startsWith("/users/") && path.length > "/users/".length) {
      return "Détail utilisateur"
    }

    // Retourner le titre correspondant ou un titre par défaut
    return titleMap[cleanPath] || "Budgix Admin"
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        {/* Bouton hamburger - visible uniquement sur mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="md:hidden -ml-2"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-sm sm:text-base md:text-lg font-semibold">
          {getPageTitle(pathname)}
        </h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {user && (
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

