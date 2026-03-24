import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

/**
 * Interface pour les métadonnées affichées dans la card
 */
interface MetadataItem {
  label: string
  value: string | number | React.ReactNode
}

/**
 * Props du composant MobileCard
 */
interface MobileCardProps {
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
  metadata?: MetadataItem[]
  status?: React.ReactNode
  actions?: React.ReactNode
  onClick?: () => void
  className?: string
}

/**
 * Composant MobileCard - Affiche les données de tableau en format card sur mobile
 *
 * Utilisé pour convertir les tables en cards empilées verticalement sur mobile
 */
export function MobileCard({
  title,
  subtitle,
  metadata,
  status,
  actions,
  onClick,
  className,
}: MobileCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-3 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow touch-manipulation",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* En-tête avec titre, sous-titre et statut */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {status && <div className="flex-shrink-0">{status}</div>}
      </div>

      {/* Métadonnées en grid 2 colonnes */}
      {metadata && metadata.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {metadata.map((item, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {item.label}
              </p>
              <p className="text-sm truncate">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Boutons d'action */}
      {actions && (
        <div className="flex gap-2 pt-3 border-t">
          {actions}
        </div>
      )}
    </Card>
  )
}
