"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FolderTree,
  BarChart3,
  Bell,
  MessageCircle,
  LogOut,
  Loader2,
  Star,
  CreditCard,
  History,
  Repeat,
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDiscussionsCount } from "@/hooks/use-discussions-count"
import { usePendingPaymentsCount } from "@/hooks/use-pending-payments-count"
/**
 * Items de navigation pour la sidebar
 */
const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Utilisateurs",
    href: "/users",
    icon: Users,
  },
  {
    title: "Catégories",
    href: "/categories",
    icon: FolderTree,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Service Client",
    href: "/support",
    icon: MessageCircle,
  },
  {
    title: "Paiements",
    href: "/payments",
    icon: CreditCard,
  },
  {
    title: "Historique Premium",
    href: "/payments-history",
    icon: History,
  },
  {
    title: "Abonnements Externes",
    href: "/external-subscriptions",
    icon: Repeat,
  },
  {
    title: "Statistiques",
    href: "/stats",
    icon: BarChart3,
  },
  {
    title: "Avis et Suggestions",
    href: "/reviews",
    icon: Star,
  },
]

/**
 * Composant Sidebar pour la navigation admin
 */
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuthStore()
  const discussionsCount = useDiscussionsCount()
  const pendingPaymentsCount = usePendingPaymentsCount()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  // Réinitialiser le chargement quand le pathname change (navigation terminée)
  useEffect(() => {
    setLoadingPath(null)
  }, [pathname])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleLinkClick = (href: string) => {
    // Ne pas afficher le loader si on clique sur la page déjà active
    if (href !== pathname) {
      setLoadingPath(href)
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="border-b p-6">
        <h1 className="text-xl font-bold">Admin Budgix</h1>
        {user && (
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const isLoading = loadingPath === item.href
          const showBadge = item.href === "/support" && discussionsCount > 0
          const showPaymentsBadge = item.href === "/payments" && pendingPaymentsCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleLinkClick(item.href)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isLoading && "opacity-70"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="flex-1">{item.title}</span>
              {showBadge && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-xs"
                >
                  {discussionsCount > 99 ? "99+" : discussionsCount}
                </Badge>
              )}
              {showPaymentsBadge && (
                <Badge
                  variant="default"
                  className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-xs bg-orange-500"
                >
                  {pendingPaymentsCount > 99 ? "99+" : pendingPaymentsCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer avec bouton de déconnexion */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}

