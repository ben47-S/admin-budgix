"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CreditCard,
  MessageCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useDiscussionsCount } from "@/hooks/use-discussions-count"
import { usePendingPaymentsCount } from "@/hooks/use-pending-payments-count"

/**
 * Interface pour les items de navigation
 */
interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: "payments" | "discussions"
}

/**
 * Items de navigation du bottom nav
 * Maximum 5 items pour une bonne UX mobile
 */
const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/stats",
    label: "Stats",
    icon: BarChart3,
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/payments",
    label: "Paiements",
    icon: CreditCard,
    badge: "payments",
  },
  {
    href: "/support",
    label: "Support",
    icon: MessageCircle,
    badge: "discussions",
  },
]

/**
 * Composant BottomNav - Barre de navigation fixe en bas sur mobile
 *
 * Visible uniquement sur mobile (<md breakpoint)
 * Avec badges pour les paiements en attente et les discussions non lues
 */
export function BottomNav() {
  const pathname = usePathname()
  const discussionsCount = useDiscussionsCount()
  const pendingPaymentsCount = usePendingPaymentsCount()

  /**
   * Obtenir le nombre de badges selon le type
   */
  const getBadgeCount = (badgeType: "payments" | "discussions" | undefined) => {
    if (badgeType === "discussions") return discussionsCount
    if (badgeType === "payments") return pendingPaymentsCount
    return 0
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const badgeCount = getBadgeCount(item.badge)
          const showBadge = item.badge && badgeCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full touch-manipulation active:scale-95 transition-transform relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <Badge
                    variant={item.badge === "payments" ? "default" : "destructive"}
                    className={cn(
                      "absolute -top-2 -right-2 h-4 min-w-4 rounded-full px-1 flex items-center justify-center text-[10px] font-semibold",
                      item.badge === "payments" && "bg-orange-500 hover:bg-orange-500"
                    )}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
