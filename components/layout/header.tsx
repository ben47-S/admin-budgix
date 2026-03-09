"use client"

import { Menu } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useSidebarStore } from "@/store/sidebar-store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

/**
 * Composant Header pour le dashboard admin
 */
export function Header() {
  const { user } = useAuthStore()
  const { toggle } = useSidebarStore()

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
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
          <h2 className="text-base sm:text-lg font-semibold">Tableau de bord</h2>
        </div>
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

