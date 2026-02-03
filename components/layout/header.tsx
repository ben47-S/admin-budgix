"use client"

import { useAuthStore } from "@/store/auth-store"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Composant Header pour le dashboard admin
 */
export function Header() {
  const { user } = useAuthStore()

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h2 className="text-lg font-semibold">Tableau de bord</h2>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <div className="text-right">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

