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
  Activity,
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useSidebarStore } from "@/store/sidebar-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useDiscussionsCount } from "@/hooks/use-discussions-count"
import { usePendingPaymentsCount } from "@/hooks/use-pending-payments-count"

/**
 * Interfaces pour la navigation par catégories
 */
interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: 'discussions' | 'payments'
}

interface NavCategory {
  label: string
  items: NavItem[]
}

/**
 * Navigation organisée par catégories
 */
const navCategories: NavCategory[] = [
  {
    label: "Vue d'ensemble",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Statistiques", href: "/stats", icon: BarChart3 },
    ]
  },
  {
    label: "Gestion",
    items: [
      { title: "Utilisateurs", href: "/users", icon: Users },
      { title: "Catégories", href: "/categories", icon: FolderTree },
    ]
  },
  {
    label: "Finances",
    items: [
      { title: "Paiements", href: "/payments", icon: CreditCard, badge: 'payments' },
      { title: "Historique Premium", href: "/payments-history", icon: History },
      { title: "Abonnements Externes", href: "/external-subscriptions", icon: Repeat },
    ]
  },
  {
    label: "Support",
    items: [
      { title: "Service Client", href: "/support", icon: MessageCircle, badge: 'discussions' },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Avis et Suggestions", href: "/reviews", icon: Star },
    ]
  },
  {
    label: "Système",
    items: [
      { title: "Logs Systèmes", href: "/logs", icon: Activity },
    ]
  },
]

/**
 * Fonctions helper pour les badges
 */
const getBadgeCount = (
  badgeType: 'discussions' | 'payments' | undefined,
  discussionsCount: number,
  pendingPaymentsCount: number
) => {
  if (badgeType === 'discussions') return discussionsCount
  if (badgeType === 'payments') return pendingPaymentsCount
  return 0
}

const getBadgeVariant = (badgeType: 'discussions' | 'payments' | undefined) => {
  if (badgeType === 'discussions') return 'destructive'
  if (badgeType === 'payments') return 'default'
  return 'default'
}

const getBadgeClassName = (badgeType: 'discussions' | 'payments' | undefined) => {
  const baseClass = "h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-xs"
  if (badgeType === 'payments') return `${baseClass} bg-orange-500`
  return baseClass
}

/**
 * Props du contenu interne de la Sidebar
 */
interface SidebarContentProps {
  pathname: string
  loadingPath: string | null
  discussionsCount: number
  pendingPaymentsCount: number
  handleLinkClick: (href: string) => void
  handleLogout: () => void
  user: { email?: string | null } | null
}

/**
 * Contenu interne de la Sidebar — extrait comme composant stable
 * pour éviter le remontage complet à chaque re-render du parent.
 */
function SidebarContent({
  pathname,
  loadingPath,
  discussionsCount,
  pendingPaymentsCount,
  handleLinkClick,
  handleLogout,
  user,
}: SidebarContentProps) {
  return (
    <div className="flex h-full w-64 flex-col bg-card">
      {/* Header */}
      <div className="border-b p-6">
        <h1 className="text-xl font-bold">Admin Budgix</h1>
        {user && (
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-4 p-4">
        {navCategories.map((category, categoryIndex) => (
          <div key={category.label} className={cn(categoryIndex > 0 && "pt-2")}>
            {/* En-tête de catégorie */}
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category.label}
              </h3>
            </div>

            {/* Items de la catégorie */}
            <div className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isLoading = loadingPath === item.href
                const badgeCount = getBadgeCount(item.badge, discussionsCount, pendingPaymentsCount)
                const showBadge = item.badge && badgeCount > 0

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
                        variant={getBadgeVariant(item.badge)}
                        className={getBadgeClassName(item.badge)}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
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

/**
 * Composant Sidebar pour la navigation admin
 */
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuthStore()
  const { isOpen, close } = useSidebarStore()
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
    // Fermer le menu mobile après navigation
    close()
  }

  const sharedProps: SidebarContentProps = {
    pathname,
    loadingPath,
    discussionsCount,
    pendingPaymentsCount,
    handleLinkClick,
    handleLogout,
    user,
  }

  return (
    <>
      {/* Version Desktop : sidebar statique (visible >= 768px) */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card">
        <SidebarContent {...sharedProps} />
      </div>

      {/* Version Mobile : Sheet drawer (visible < 768px) */}
      <Sheet open={isOpen} onOpenChange={close}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent {...sharedProps} />
        </SheetContent>
      </Sheet>
    </>
  )
}

